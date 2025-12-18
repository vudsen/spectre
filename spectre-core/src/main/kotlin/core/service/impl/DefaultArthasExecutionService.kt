package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.dto.*
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO.Companion.toDTO
import io.github.vudsen.spectre.api.dto.ToolchainItemDTO.Companion.toDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.api.service.ToolchainService
import io.github.vudsen.spectre.common.progress.ProgressReportHolder
import io.github.vudsen.spectre.core.bean.ArthasClientInitStatus
import io.github.vudsen.spectre.core.bean.ArthasClientWrapper
import io.github.vudsen.spectre.core.internal.ArthasClientCacheService
import io.github.vudsen.spectre.core.lock.RedisDistributedLock
import io.github.vudsen.spectre.repo.RuntimeNodeRepository
import io.github.vudsen.spectre.repo.ToolchainItemRepository
import io.github.vudsen.spectre.repo.entity.ToolchainType
import io.github.vudsen.spectre.repo.po.ToolchainItemId
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.task.TaskExecutor
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.expression.spel.SpelNode
import org.springframework.expression.spel.ast.*
import org.springframework.expression.spel.standard.SpelExpression
import org.springframework.expression.spel.standard.SpelExpressionParser
import org.springframework.stereotype.Service
import java.lang.reflect.InvocationTargetException
import java.time.Duration
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock
import kotlin.jvm.optionals.getOrNull


/**
 * 管理 Arthas 连接的服务。
 *
 *
 * 为了确保未来集群能够正常使用，当成功 attach 到一个 JVM 后，会往 Redis 中写 [ArthasChannelDTO] 数据，对于后续的 attach 请求
 * 将会直接复用对应的端口以及其它数据。
 *
 * ## 资源类型：
 *
 * ### Channel
 *
 * 频道，在代码上代表一个 [ArthasHttpClient] 实例，表示一个到 arthas 的连接。
 *
 * 可用上下文：
 * - [ArthasChannelDTO]
 *
 * ### Consumer
 *
 * 消费者，用于接收 arthas 消息，一个 `Channel` 可以有多个 `Consumer`.
 *
 * 创建步骤：
 * 1. 客户端调用 [DefaultArthasExecutionService.requireAttach] 获取到 `channelId`
 * 2. 客户端调用 [DefaultArthasExecutionService.joinChannel] 来加入频道
 *
 * 注意事项:
 * 1. 执行命令不需要消费者，只需要频道，执行完后所有的消费者都能看到
 *
 *
 *
 */
@Service
class DefaultArthasExecutionService(
    private val redisTemplate: RedisTemplate<String, Any>,
    @param:Qualifier("applicationTaskExecutor") private val executor: TaskExecutor,
    private val redisDistributedLock: RedisDistributedLock,
    private val arthasClientCacheService: ArthasClientCacheService,
    private val runtimeNodeService: RuntimeNodeService
) : ArthasExecutionService {

    companion object {
        private val logger = LoggerFactory.getLogger(DefaultArthasExecutionService::class.java)
        private val COMMON_REDIS_EXPIRE_TIME = Duration.ofMinutes(10)
        private val ALLOWED_EXPRESSION: Set<Class<*>> = setOf(
            Literal::class.java,
            PropertyOrFieldReference::class.java,
            VariableReference::class.java,
            OpAnd::class.java, OpOr::class.java,
            OpEQ::class.java, OpNE::class.java,
            OpGT::class.java, OpGE::class.java,
            OpLT::class.java, OpLE::class.java,
            OpPlus::class.java, OpMinus::class.java,
            OpMultiply::class.java, OpDivide::class.java,
            CompoundExpression::class.java,
            InlineList::class.java,
            Indexer::class.java,
            IntLiteral::class.java,
            LongLiteral::class.java,
            NullLiteral::class.java,
        )
        val parser = SpelExpressionParser()

    }

    @Autowired
    private lateinit var toolchainService: ToolchainService

    @Autowired
    private lateinit var toolchainItemRepository: ToolchainItemRepository

    private val objectMapper: ObjectMapper = ObjectMapper()

    private val modifyLock = ReentrantLock()

    private fun resolveJvmId(runtimeNodeId: Long, jvm: Jvm): String {
        return "${runtimeNodeId}:${jvm.hashCode()}"
    }


    override fun requireAttach(
        runtimeNodeId: Long,
        treeNodeId: String,
        bundleId: Long,
    ): AttachStatus {
        val runtimeNodeDto =
            runtimeNodeService.findPureRuntimeNodeById(runtimeNodeId) ?: throw BusinessException("error.runtime.node.not.exist")
        val extPoint = runtimeNodeService.getExtPoint(runtimeNodeDto.pluginId)

        val node = runtimeNodeService.findTreeNode(treeNodeId) ?: throw NamedExceptions.SESSION_EXPIRED.toException()
        val jvm = extPoint.createSearcher().deserializeJvm(node)
        arthasClientCacheService.resolveCachedClient(runtimeNodeId, jvm) ?.let {
            return AttachStatus(true).apply {
                channelId = it.channelId
            }
        }

        val jvmId = arthasClientCacheService.resolveJvmId(runtimeNodeId, jvm)

        // start init channel
        val status = arthasClientCacheService.startInit(jvmId) ?: return AttachStatus(false)

        // error check
        status.error ?.let {
            if (System.currentTimeMillis() >= it.nextRetryTime) {
                status.error = null
            } else {
                return returnAttachingMsg(status)
            }
        }

        // try lock
        if (!status.clientInitLock.compareAndSet(false, true)) {
            return returnAttachingMsg(status)
        }

        // recheck
        arthasClientCacheService.resolveCachedClient(jvmId)?.let {
            return AttachStatus(true).apply {
                channelId = it.channelId
            }
        }

        try {
            attachJvmAsync(extPoint, runtimeNodeDto, jvm, status, bundleId, treeNodeId)
            return returnAttachingMsg(status)
        } catch (e: Exception) {
            status.clientInitLock.set(false)
            throw e
        }
    }

    private fun returnAttachingMsg(holder: ArthasClientInitStatus): AttachStatus {
        return AttachStatus(false).apply {
            error = holder.error
            holder.progressManager.currentProgress()?.let {
                title = it.title
                message = it.title
            }
        }
    }


    private fun arthasInitDistributedLockKey(runtimeNodeId: Long): String {
        return "runtime-node-lock:${runtimeNodeId}"
    }

    override fun joinChannel(channelId: String, ownerIdentifier: String): ArthasConsumerDTO {
        // 除非使用 redis，不然每次重启都会丢失数据
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("Channel 已经关闭，请重新在列表中连接")
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
            (redisTemplate.opsForValue().get(consumerCacheKey) as ArthasConsumerDTO?)?.let {
                return it
            }
            val jvmId = resolveJvmId(data.runtimeNodeId, data.jvm)
            var client = arthasClientCacheService.resolveCachedClient(jvmId)?.client
            if (client == null) {
                modifyLock.lock()
                try {
                    val newClient = createClient(data, data)
                    // 本地未缓存，但是 redis 有，一般大概率出现在集群环境
                    arthasClientCacheService.saveClient(jvmId, ArthasClientWrapper(newClient, channelId))
                    client = newClient
                } finally {
                    modifyLock.unlock()
                }
            }
            val session = ArthasConsumerDTO(client.joinSession(data.sessionId).consumerId, data.jvm.name)
            // 用于解决创建期间的并发，该方法返回后，相关数据会保存到用户自己的 session 中，这里的数据就没必要了
            redisTemplate.opsForValue().set(consumerCacheKey, session, 1, TimeUnit.MINUTES)
            return session
        } finally {
            redisTemplate.delete(distributedLockKey)
        }
    }

    private fun createClient(
        info: ArthasChannelDTO,
        metadata: ArthasChannelDTO
    ): ArthasHttpClient {
        val extPoint = runtimeNodeService.getExtPoint(metadata.extPointId)
        val runtimeNode = runtimeNodeService.resolveRuntimeNode(info.runtimeNodeId)

        val bundle = toolchainService.resolveToolchainBundle(metadata.bundleId) ?: TODO("bundle not found.")
        val handler = extPoint.createAttachHandler(runtimeNode, info.jvm, bundle)
        return handler.attach(info.port)
    }

    /**
     * 异步 attach 到 jvm
     *
     * 该方法会设置 [ArthasChannelDTO]，主要用于保存最终连接的端口
     */
    private fun attachJvmAsync(
        extPoint: RuntimeNodeExtensionPoint,
        runtimeNodeDto: RuntimeNodeDTO,
        jvm: Jvm,
        holder: ArthasClientInitStatus,
        bundleId: Long,
        treeNodeId: String,
    ) {
        executor.execute {
            val lockKey = arthasInitDistributedLockKey(runtimeNodeDto.id)
            if (!redisDistributedLock.tryLock(lockKey)) {
                return@execute
            }

            ProgressReportHolder.startProgress(holder.progressManager)
            logger.info("Start creating new http client for jvm(id = {}), name = {}", jvm.id, jvm.name)
            try {
                val channelData = resolveArthasChannel(holder.channelId)
                if (channelData != null) {
                    return@execute
                }

                val bundle = toolchainService.resolveToolchainBundle(bundleId) ?: TODO("bundle not found.")
                val runtimeNode =
                    extPoint.connect(
                        objectMapper.readValue(
                            runtimeNodeDto.configuration,
                            extPoint.getConfigurationClass()
                        )
                    )

                val handler = extPoint.createAttachHandler(runtimeNode, jvm, bundle)
                val client: ArthasHttpClient = handler.attach(null)

                logger.info("Successfully created client for jvm(id = {}), name = {}", jvm.id, jvm.name)

                val session = client.initSession()

                val data = ArthasChannelDTO(
                    session.sessionId,
                    runtimeNodeDto.id,
                    treeNodeId,
                    client.getPort(),
                    runtimeNodeDto.restrictedMode,
                    bundleId,
                    extPoint.getId()
                ).apply {
                    this.jvm = jvm
                }
                saveChannelDTO(holder.channelId, data)
                val jvmId = arthasClientCacheService.resolveJvmId(runtimeNodeDto.id, jvm)
                arthasClientCacheService.saveClient(jvmId, ArthasClientWrapper(client, holder.channelId))
            } catch (e: Exception) {
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
                holder.clientInitLock.set(false)
                ProgressReportHolder.clear()
            }
        }
    }

    private fun resolveArthasChannel(channelId: String): ArthasChannelDTO? {
        val result = redisTemplate.opsForValue().get("arthas:channel:${channelId}") as ArthasChannelDTO?
        flushCacheTime(channelId)
        return result
    }

    private fun saveChannelDTO(channelId: String, data: ArthasChannelDTO) {
        redisTemplate.opsForValue().setIfAbsent("arthas:channel:${channelId}", data, COMMON_REDIS_EXPIRE_TIME)
    }

    private fun flushCacheTime(channelId: String) {
        redisTemplate.expire("arthas:channel:${channelId}", COMMON_REDIS_EXPIRE_TIME)
        redisTemplate.expire("arthas:channel:metadata:${channelId}", COMMON_REDIS_EXPIRE_TIME)
    }


    /**
     * 尝试获取 client，如果没有，则尝试创建一个新的
     */
    private fun tryResolveClient(channelInfo: ArthasChannelDTO, channelId: String): ArthasHttpClient {
        val jvmId = resolveJvmId(channelInfo.runtimeNodeId, channelInfo.jvm)
        arthasClientCacheService.resolveCachedClient(jvmId)?.let {
            return it.client
        }

        val client = createClient(channelInfo, channelInfo)
        arthasClientCacheService.saveClient(jvmId, ArthasClientWrapper(client, channelId))
        return client
    }

    override fun execAsync(channelId: String, command: String) {
        // TODO 把 controller 的策略权限校验移到这里来.
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)
        if (data.restrictedMode) {
            checkOgnlExpression(command)
        }
        client.asyncExec(data.sessionId, command)
    }

    fun checkOgnlExpression(command: String) {
        // Ognl 和 SpEL 差不多的
        for (rawExpression in splitOgnlExpression(command)) {
            val expression = try {
                parser.parseExpression(rawExpression) as SpelExpression
            } catch (_: Exception) {
                throw BusinessException("error.ognl.parse.failed")
            }
            validateAst(expression.ast)
        }
    }

    /**
     * **AI GENERATED**:
     *
     * 帮我写一个 Kotlin 工具函数，这个函数输入一个字符串，你需要提取出所有双引号或单引号包裹的子字符串，返回为一个字符串列表。
     *
     * ## 样例
     * ### 样例 1
     *
     * 输入: `hello "wo rld" '!! !!'`
     *
     * 输出: `["wo rld", "!! !!"]`
     *
     * ### 样例 2
     *
     * 输入: `hello "\"wo \"rld" '\\!!\'!!'`
     *
     * 输出: `["\"wo \"rld", "\\!!\'!!"]`
     *
     * 解释: `\` 为转义符，`\"` 或 `\'` 不应该视为开始或结束的标志
     *
     * ### 样例 3
     *
     * 输入: `I "love 'you'"`
     *
     * 输出: `[love 'you']`
     *
     * 解释: 虽然 `you` 被单引号包裹，但是它已经被双引号包裹了，所以需要将其当做普通的单引号
     *
     * ## 注意事项
     *
     * 1. 不要使用正则表达式，一个字符一个字符解析
     * 2. 未来不需要扩展，**保持代码简洁，不要考虑扩展性**
     *
     * @param input 需要解析的命令
     * @return 识别到的子串
     */
    private fun splitOgnlExpression(input: String): List<String> {
        val result = mutableListOf<String>()
        var currentIndex = 0

        while (currentIndex < input.length) {
            val startChar = input[currentIndex]

            // 检查当前字符是否是引号的起始
            if (startChar == '"' || startChar == '\'') {
                val closingQuote = startChar // 匹配的结束引号
                val contentBuilder = StringBuilder()
                var isEscaped = false // 跟踪前一个字符是否是转义符 '\'

                // 从引号后的下一个字符开始
                var innerIndex = currentIndex + 1

                // 循环直到字符串结束或者找到匹配的结束引号
                while (innerIndex < input.length) {
                    val currentChar = input[innerIndex]
                    if (isEscaped) {
                        // 如果前一个字符是转义符，则当前字符被视为普通字符，
                        // 无论它是什么（包括引号或转义符本身），并添加到内容中。
                        contentBuilder.append(currentChar)
                        isEscaped = false
                    } else {
                        // 没有转义的情况
                        when (currentChar) {
                            '\\' -> {
                                // 遇到转义符，设置标志，但不添加到内容中。
                                isEscaped = true
                            }
                            closingQuote -> {
                                // 遇到未转义的匹配结束引号，说明子字符串提取完成
                                result.add(contentBuilder.toString())
                                currentIndex = innerIndex + 1 // 更新外部循环的起始位置到结束引号的下一个字符
                                innerIndex = -1 // 标记内部循环结束
                                break
                            }
                            else -> {
                                // 遇到普通字符，添加到内容中
                                contentBuilder.append(currentChar)
                            }
                        }
                    }
                    if (innerIndex != -1) {
                        innerIndex++
                    }
                }
                // 如果内部循环因为达到字符串末尾而结束，但没有找到结束引号，
                // 那么该引号块是不完整的，我们继续从原先的currentIndex的下一个位置开始扫描。
                // 这种情况下，我们不更新currentIndex，因为它在内部循环中已经被正确更新。
                if (innerIndex != -1) {
                    // 如果内部循环没有break (即没有找到匹配的结束引号)
                    currentIndex++
                }
            } else {
                // 如果当前字符不是引号，则跳过它
                currentIndex++
            }
        }
        return result
    }

    private fun validateAst(node: SpelNode) {
        if (!ALLOWED_EXPRESSION.contains(node.javaClass)) {
            throw BusinessException("error.invalid.ognl.expression", arrayOf(node.javaClass.getSimpleName()))
        }

        for (i in 0..<node.childCount) {
            validateAst(node.getChild(i))
        }
    }


    override fun pullResults(channelId: String, consumerId: String): Any {
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)
        return client.pullResults(data.sessionId, consumerId)
    }

    override fun getChannelInfo(channelId: String): ArthasChannelDTO? {
        return resolveArthasChannel(channelId)
    }

    override fun interruptCommand(channelId: String) {
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)
        client.interruptJob(data.sessionId)
    }




}