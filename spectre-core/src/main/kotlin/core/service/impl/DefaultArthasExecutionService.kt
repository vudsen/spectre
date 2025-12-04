package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.dto.ArthasChannelInfoDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.dto.ChannelSessionDTO
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.core.integrate.abac.ArthasExecutionABACContext
import io.github.vudsen.spectre.core.lock.RedisDistributedLock
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.repo.RuntimeNodeRepository
import io.github.vudsen.spectre.repo.ToolchainItemRepository
import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.api.service.ToolchainService
import io.github.vudsen.spectre.common.progress.ProgressManager
import io.github.vudsen.spectre.common.progress.ProgressReportHolder
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO.Companion.toDTO
import io.github.vudsen.spectre.api.dto.ToolchainItemDTO.Companion.toDTO
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.repo.entity.ToolchainType
import io.github.vudsen.spectre.api.perm.ABACPermissions
import io.github.vudsen.spectre.repo.po.ToolchainItemId
import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.task.TaskExecutor
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.lang.reflect.InvocationTargetException
import java.time.Duration
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.locks.ReentrantLock
import kotlin.jvm.optionals.getOrNull

/**
 * 管理 Arthas 连接的服务。
 *
 * 每个服务都会在本地缓存 [ClientHolder] 来保证每次请求都不会重复创建。
 *
 * 为了确保未来集群能够正常使用，当成功 attach 到一个 JVM 后，会往 Redis 中写 [ArthasChannelInfoDTO] 数据，对于后续的 attach 请求
 * 将会直接复用对应的端口以及其它数据。
 */
@Service
class DefaultArthasExecutionService(
    private val redisTemplate: RedisTemplate<String, Any>,
    private val executor: TaskExecutor,
    private val redisDistributedLock: RedisDistributedLock,
) : ArthasExecutionService {

    companion object {
        private val logger = LoggerFactory.getLogger(DefaultArthasExecutionService::class.java)
        private val COMMON_REDIS_EXPIRE_TIME = Duration.ofMinutes(10)
    }

    /**
     * 这样注入 Kotlin 有非空检查，但是又不想全写构造器里面。。
     */
    @Autowired
    private lateinit var runtimeNodeService: RuntimeNodeService

    @Autowired
    private lateinit var runtimeNodeRepository: RuntimeNodeRepository

    @Autowired
    private lateinit var toolchainService: ToolchainService

    @Autowired
    private lateinit var toolchainItemRepository: ToolchainItemRepository

    @Autowired
    private lateinit var appAccessControlService: AppAccessControlService

    private val objectMapper: ObjectMapper = ObjectMapper()

    /**
     * 保存 jvm 到客户端的缓存
     */
    private val clientMap = ConcurrentHashMap<Jvm, ClientHolder>()

    private val modifyLock = ReentrantLock()

    /**
     * 在服务内存中缓存的客户端数据.
     */
    private class ClientHolder(val channelId: String) {
        /**
         * 本地缓存的客户端. 若为空，表示正在初始化中
         */
        var client: ArthasHttpClient? = null
        /**
         * 客户端初始化锁，避免并发，每次限制只有一个线程能够初始化，并且在初始化完全或失败前，锁将保持持有
         */
        var lock: AtomicBoolean = AtomicBoolean(false)
        /**
         * 在创建客户端时的错误信息
         */
        var error: AttachStatus.ErrorInfo? = null
        /**
         * 进度指示器，用于获取当前初始化进度
         */
        val progressManager = ProgressManager()
    }



    override fun requireAttach(
        runtimeNodeId: Long,
        treeNodeId: String,
        bundleId: Long,
    ): AttachStatus {
        val runtimeNodeDto = runtimeNodeRepository.findById(runtimeNodeId).getOrNull()?.toDTO() ?: throw BusinessException("节点不存在")
        val extPoint = runtimeNodeService.getExtPoint(runtimeNodeDto.pluginId) ?: throw BusinessException("插件不存在")

        val node = runtimeNodeService.findTreeNode(treeNodeId) ?: throw NamedExceptions.SESSION_EXPIRED.toException()
        val jvm = extPoint.createSearcher().deserializeJvm(node)

        val holder = clientMap[jvm]
        var currentHolder: ClientHolder
        if (holder == null) {
            // 本地没有记录
            if (!modifyLock.tryLock()) {
                return AttachStatus(false)
            }
            try {
                val holderCheck = clientMap[jvm]
                if (holderCheck == null) {
                    val newHolder = ClientHolder(UUID.randomUUID().toString())
                    // is deadlock here?
                    clientMap[jvm] = newHolder
                    currentHolder = newHolder
                } else {
                    currentHolder = holderCheck
                }
            } finally {
                modifyLock.unlock()
            }
        } else {
            currentHolder = holder
            holder.error ?.let {
                if (System.currentTimeMillis() >= it.nextRetryTime) {
                    holder.error = null
                } else {
                    return returnAttachingMsg(holder)
                }
            }
            holder.client ?.let {
                getChannelData(holder.channelId) ?: return AttachStatus(false)
                return AttachStatus(true).apply {
                    channelId = holder.channelId
                }
            }
            if (holder.lock.get()) {
                return returnAttachingMsg(holder)
            }
        }

        
        if (!currentHolder.lock.compareAndSet(false, true)) {
            return returnAttachingMsg(currentHolder)
        }
        if (clientMap.contains(jvm)) {
            // 懒得写了 :( 让客户端自己再轮询一次
            currentHolder.lock.set(false)
            return returnAttachingMsg(currentHolder)
        }

        try {
            attachJvmAsync(extPoint, runtimeNodeDto, jvm, currentHolder, bundleId)
            return returnAttachingMsg(currentHolder)
        } catch (e: Exception) {
            currentHolder.lock.set(false)
            throw e
        }
    }

    private fun returnAttachingMsg(holder: ClientHolder): AttachStatus {
        return AttachStatus(false).apply {
            error = holder.error
            holder.progressManager.currentProgress() ?.let {
                title = it.title
                message = it.title
            }
        }
    }

    /**
     * channel 内部信息
     */
    private class ChannelInnerMetadata {
        var bundleId: Long = -1L
        lateinit var extPointId: String
        var runtimeNodeId: Long = -1L
    }

    private fun innerMetadataKey(channelId: String): String {
        return "arthas:channel:metadata:${channelId}"
    }

    private fun arthasInitDistributedLockKey(runtimeNodeId: Long): String {
        return "runtime-node-lock:${runtimeNodeId}"
    }

    override fun joinChannel(channelId: String, ownerIdentifier: String): ChannelSessionDTO {
        // 除非使用 redis，不然每次重启都会丢失数据
        val data = getChannelData(channelId) ?: throw BusinessException("Channel 已经关闭，请重新在列表中连接")
        val distributedLockKey = "arthas:channel:join-lock:${ownerIdentifier}"
        // 并发概率不高，先这样简单写，主要是防止前端 react 开发模式同时发两次请求
        var locked = false
        for (i in 0 until 10) {
            if (redisTemplate.opsForValue().setIfAbsent(distributedLockKey, 1, 30, TimeUnit.SECONDS) == true) {
                locked = true
                break
            }
            Thread.sleep(1000)
        }
        if (!locked) {
            throw BusinessException("加入频道超时，请稍后重试")
        }
        val consumerCacheKey = "channel:consumer:${channelId}:${ownerIdentifier}"
        try {
            (redisTemplate.opsForValue().get(consumerCacheKey) as ChannelSessionDTO?) ?.let {
                return it
            }
            var client = clientMap[data.jvm]?.client
            if (client == null) {
                val key = innerMetadataKey(channelId)
                val metadata = redisTemplate.opsForValue().get(key) as ChannelInnerMetadata? ?: throw BusinessException("Channel 已经关闭，请重新在列表中连接")
                modifyLock.lock()
                try {
                    val newClient = createClient(data, metadata)
                    clientMap[data.jvm] = ClientHolder(channelId).apply {
                        this.client = newClient
                    }
                    client = newClient
                } finally {
                    modifyLock.unlock()
                }
            }
            val session = ChannelSessionDTO(client.joinSession(data.sessionId).consumerId, data.jvm.name)
            // 用于解决创建期间的并发，该方法返回后，相关数据会保存到用户自己的 session 中，这里的数据就没必要了
            redisTemplate.opsForValue().set(consumerCacheKey, session, 1, TimeUnit.MINUTES)
            return session
        } finally {
            redisTemplate.delete(distributedLockKey)
        }
    }

    private fun createClient(
        info: ArthasChannelInfoDTO,
        metadata: ChannelInnerMetadata
    ): ArthasHttpClient {
        val extPoint = runtimeNodeService.getExtPoint(metadata.extPointId)
        val runtimeNode = runtimeNodeService.resolveRuntimeNode(info.runtimeNodeId)

        val bundle = toolchainService.resolveToolchainBundle(metadata.bundleId) ?: TODO("bundle not found.")
        val handler = extPoint.createAttachHandler(runtimeNode, info.jvm, ToolchainBundleDTO(
            toolchainItemRepository.findById(ToolchainItemId(ToolchainType.JATTACH, bundle.jattachTag)).get()
                .toDTO(),
            toolchainItemRepository.findById(ToolchainItemId(ToolchainType.ARTHAS, bundle.arthasTag)).get()
                .toDTO(),
            toolchainItemRepository.findById(ToolchainItemId(ToolchainType.HTTP_CLIENT, bundle.httpClientTag))
                .get()
                .toDTO(),
        ))
        return handler.attach(info.port)
    }

    /**
     * 异步 attach 到 jvm
     *
     * 该方法会设置 [ArthasChannelInfoDTO] 和 [ChannelInnerMetadata]，前者主要用于保存最终连接的端口，后者用于重复连接时，提供充足的元数据来恢复连接
     */
    private fun attachJvmAsync(
        extPoint: RuntimeNodeExtensionPoint,
        runtimeNodeDto: RuntimeNodeDTO,
        jvm: Jvm,
        holder: ClientHolder,
        bundleId: Long,
    ) {
        executor.execute {
            val lockKey = arthasInitDistributedLockKey(runtimeNodeDto.id)
            if (!redisDistributedLock.tryLock(lockKey)) {
                return@execute
            }

            ProgressReportHolder.startProgress(holder.progressManager)
            logger.info("Start creating new http client for jvm(id = {}), name = {}", jvm.id, jvm.name)
            try {
                val channelData = getChannelData(holder.channelId)
                if (channelData != null) {
                    return@execute
                }

                val bundle = toolchainService.resolveToolchainBundle(bundleId) ?: TODO("bundle not found.")
                val runtimeNode =
                    extPoint.connect(objectMapper.readValue(runtimeNodeDto.configuration, extPoint.getConfigurationClass()))


                val handler = extPoint.createAttachHandler(runtimeNode, jvm, ToolchainBundleDTO(
                    toolchainItemRepository.findById(ToolchainItemId(ToolchainType.JATTACH, bundle.jattachTag)).get()
                        .toDTO(),
                    toolchainItemRepository.findById(ToolchainItemId(ToolchainType.ARTHAS, bundle.arthasTag)).get()
                        .toDTO(),
                    toolchainItemRepository.findById(ToolchainItemId(ToolchainType.HTTP_CLIENT, bundle.httpClientTag))
                        .get()
                        .toDTO(),
                ))

                val client: ArthasHttpClient? = handler.attach(null)
                if (client == null) {
                    throw BusinessException("端口已被占用, 请稍后重试")
                }
                logger.info("Client creation success!")

                val session = client.initSession()

                val data = ArthasChannelInfoDTO(session.sessionId, runtimeNodeDto.id, client.getPort()).apply {
                    this.jvm = jvm
                }
                setChannelData(holder.channelId, data)
                redisTemplate.opsForValue().set(innerMetadataKey(holder.channelId), ChannelInnerMetadata().apply {
                    this.extPointId = extPoint.getId()
                    this.runtimeNodeId = runtimeNodeDto.id
                    this.bundleId = bundle.id!!
                }, COMMON_REDIS_EXPIRE_TIME)
                clientMap[jvm]!!.client = client
            }  catch (e: Exception) {
                val ex = if (e is InvocationTargetException) {
                    e.targetException
                } else {
                    e
                }
                holder.error =
                    AttachStatus.ErrorInfo(ex.message ?: "<Unknown>", System.currentTimeMillis() + 5000)
                logger.debug("Failed to attach", e)
            } finally {
                redisDistributedLock.unlock(lockKey)
                holder.lock.set(false)
                ProgressReportHolder.clear()
            }
        }
    }

    private fun getChannelData(channelId: String): ArthasChannelInfoDTO? {
        val result = redisTemplate.opsForValue().get("arthas:channel:${channelId}") as ArthasChannelInfoDTO?
        flushCacheTime(channelId)
        return result
    }


    private fun setChannelData(channelId: String, data: ArthasChannelInfoDTO) {
        redisTemplate.opsForValue().setIfAbsent("arthas:channel:${channelId}", data, COMMON_REDIS_EXPIRE_TIME)
    }

    private fun flushCacheTime(channelId: String) {
        redisTemplate.expire("arthas:channel:${channelId}", COMMON_REDIS_EXPIRE_TIME)
        redisTemplate.expire("arthas:channel:metadata:${channelId}", COMMON_REDIS_EXPIRE_TIME)
    }


    /**
     * 尝试从 [clientMap] 中获取 client，如果没有，则尝试创建一个新的
     */
    private fun tryResolveClient(channelInfo: ArthasChannelInfoDTO, channelId: String): ArthasHttpClient {
        var holder = clientMap[channelInfo.jvm]
        if (holder == null) {
            holder = ClientHolder(channelId)
        } else {
            holder.client ?.let {
                return it
            }
        }
        val metadata = redisTemplate.opsForValue().get(innerMetadataKey(channelId)) as ChannelInnerMetadata? ?: throw BusinessException("会话过期，请刷新页面")
        val client = createClient(channelInfo, metadata)
        holder.client = client
        return client
    }

    override fun execAsync(channelId: String, command: String) {
        val data = getChannelData(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val runtimeNodeDTO = runtimeNodeService.getRuntimeNode(data.runtimeNodeId) ?: throw BusinessException("节点不存在")


        appAccessControlService.checkPolicyPermission(ArthasExecutionABACContext(ABACPermissions.RUNTIME_NODE_ARTHAS_EXECUTE, command, runtimeNodeDTO, data.jvm))
        val client = tryResolveClient(data, channelId)
        client.asyncExec(data.sessionId, command)
    }

    override fun pullResults(channelId: String, consumerId: String): Any {
        val data = getChannelData(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)
        return client.pullResults(data.sessionId, consumerId)
    }

    override fun getChannelInfo(channelId: String): ArthasChannelInfoDTO? {
        return getChannelData(channelId)
    }

    override fun interruptCommand(channelId: String) {
        val data = getChannelData(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)
        client.interruptJob(data.sessionId)
    }

    @PreDestroy
    fun destroy() {
        for (entry in clientMap.entries) {
            try {
                entry.value.client?.exec("stop")
            } catch (e: Exception) {
                logger.warn("Failed to destroy client listen on {}, reason: {}", entry.value.client?.getPort(), e.message)
            }
        }
    }


}