package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.JsonNode
import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.dto.*
import io.github.vudsen.spectre.api.entity.ProfilerFile
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.api.exception.SessionNotFoundException
import io.github.vudsen.spectre.api.perm.AppPermissions
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.ArthasInstanceService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.api.service.ToolchainService
import io.github.vudsen.spectre.common.SecureRandomFactory
import io.github.vudsen.spectre.common.util.SecureUtils
import io.github.vudsen.spectre.common.progress.ProgressReportHolder
import io.github.vudsen.spectre.core.bean.ArthasClientInitStatus
import io.github.vudsen.spectre.core.configuration.constant.CacheConstant
import io.github.vudsen.spectre.core.integrate.abac.ArthasExecutionPolicyPermissionContext
import io.github.vudsen.spectre.core.integrate.abac.AttachNodePolicyPermissionContext
import io.github.vudsen.spectre.common.util.KeyBasedLock
import io.github.vudsen.spectre.repo.po.ArthasInstancePO
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.cache.CacheManager
import org.springframework.core.task.TaskExecutor
import org.springframework.expression.spel.SpelNode
import org.springframework.expression.spel.ast.*
import org.springframework.expression.spel.standard.SpelExpression
import org.springframework.expression.spel.standard.SpelExpressionParser
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.lang.reflect.InvocationTargetException
import java.time.Instant
import java.util.UUID
import java.util.concurrent.locks.ReentrantLock


/**
 * 管理 Arthas 连接的服务。
 *
 *
 * 为了确保未来集群能够正常使用，当成功 attach 到一个 JVM 后，会往 Redis 中写 [ArthasInstanceDTO] 数据，对于后续的 attach 请求
 * 将会直接复用对应的端口以及其它数据。
 *
 * ## 资源类型：
 *
 * ### Channel
 *
 * 频道，在代码上代表一个 [ArthasHttpClient] 实例，表示一个到 arthas 的连接。
 *
 * 可用上下文：
 * - [ArthasInstanceDTO]
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
    cacheManager: CacheManager,
    @param:Qualifier("applicationTaskExecutor") private val executor: TaskExecutor,
    private val runtimeNodeService: RuntimeNodeService,
    private val toolchainService: ToolchainService,
    private val appAccessControlService: AppAccessControlService,
    private val arthasInstanceService: ArthasInstanceService
) : ArthasExecutionService {

    companion object {
        private val logger = LoggerFactory.getLogger(DefaultArthasExecutionService::class.java)
        private const val MAX_IDLE_MILLISECONDS = 1000 * 60 * 5
        private const val MAX_PROFILER_FILE_COUNT= 10
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
        private val DISALLOWED_ARTHAS_COMMAND =
            setOf("auth", "cat", "base64", "cls", "dump", "grep", "keymap", "mc", "quit", "pwd", "tee", "echo")
    }

    private val modifyLock = ReentrantLock()

    private val joinLock = KeyBasedLock(executor)

    private val cache = cacheManager.getCache(CacheConstant.QUICK_EXPIRE_CACHE_KEY)!!

    private val clientInitMap = HashMap<String, ArthasClientInitStatus>()


    private fun resolveJvmId(runtimeNodeId: Long, jvm: Jvm): String {
        return "${runtimeNodeId}:${jvm.hashCode()}"
    }

    private fun checkTreeNodePermission(channelId: String) {
        val info = arthasInstanceService.findInstanceByChannelId(channelId)
            ?: throw BusinessException("error.channel.not.exist")
        checkTreeNodePermission(info.runtimeNodeId, info.id)
    }

    private fun checkTreeNodePermission(runtimeNodeId: Long, treeNodeId: String) {
        val treeNode = runtimeNodeService.findTreeNode(treeNodeId)
            ?: throw BusinessException("节点不存在")
        val node =
            runtimeNodeService.findPureRuntimeNodeById(runtimeNodeId) ?: throw BusinessException("运行节点不存在")
        val ctx = AttachNodePolicyPermissionContext(AppPermissions.RUNTIME_NODE_ATTACH, node, treeNode)
        appAccessControlService.checkPolicyPermission(ctx)
    }

    private fun checkCommandExecPermission(channelId: String, commands: List<String>) {
        if (DISALLOWED_ARTHAS_COMMAND.contains(commands[0])) {
            throw BusinessException("error.command.not.allowed", arrayOf(commands[0]))
        }
        val info = arthasInstanceService.findInstanceByChannelId(channelId)
            ?: throw BusinessException("error.channel.not.exist")
        val runtimeNodeDTO =
            runtimeNodeService.findPureRuntimeNodeById(info.runtimeNodeId) ?: throw BusinessException("节点不存在")

        appAccessControlService.checkPolicyPermission(
            ArthasExecutionPolicyPermissionContext(
                commands,
                runtimeNodeDTO,
                info.jvm
            )
        )
    }

    @Scheduled(cron = "0 0/5 * * * ?")
    fun cleanerTask() {
        val current = System.currentTimeMillis()

        val iterator1 = clientInitMap.entries.iterator()
        while (iterator1.hasNext()) {
            val nx = iterator1.next()
            if (current - nx.value.lastAccess >= MAX_IDLE_MILLISECONDS) {
                iterator1.remove()
            }
        }
    }

    fun startInitClient(jvmId: String): ArthasClientInitStatus? {
        clientInitMap[jvmId]?.let {
            it.lastAccess = System.currentTimeMillis()
            return it
        }
        if (!modifyLock.tryLock()) {
            return null
        }
        try {
            clientInitMap[jvmId]?.let {
                it.lastAccess = System.currentTimeMillis()
                return it
            }
            val arthasClientInitStatus =
                ArthasClientInitStatus(UUID.randomUUID().toString(), System.currentTimeMillis())
            clientInitMap[jvmId] = arthasClientInitStatus
            return arthasClientInitStatus
        } finally {
            modifyLock.unlock()
        }
    }


    override fun requireAttach(
        runtimeNodeId: Long,
        treeNodeId: String,
        bundleId: Long,
    ): AttachStatus {
        checkTreeNodePermission(runtimeNodeId, treeNodeId)

        val runtimeNodeDto =
            runtimeNodeService.findPureRuntimeNodeById(runtimeNodeId)
                ?: throw BusinessException("error.runtime.node.not.exist")

        val node = runtimeNodeService.findTreeNode(treeNodeId) ?: throw NamedExceptions.SESSION_EXPIRED.toException()
        val jvm = runtimeNodeService.deserializeToJvm(runtimeNodeDto.pluginId, node)
        arthasInstanceService.resolveCachedClient(treeNodeId)?.let {
            if (it.first != null) {
                return AttachStatus(true).apply {
                    channelId = it.second.channelId
                }
            }
        }

        val jvmId = resolveJvmId(runtimeNodeId, jvm)

        // start init channel
        val status = startInitClient(jvmId) ?: return AttachStatus(false)

        // error check
        status.error?.let {
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
        arthasInstanceService.resolveCachedClient(treeNodeId)?.let {
            if (it.first != null) {
                return AttachStatus(true).apply {
                    channelId = it.second.channelId
                }
            }
        }

        try {
            attachJvmAsync(runtimeNodeDto, jvm, status, bundleId, treeNodeId)
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
        checkTreeNodePermission(channelId)
        val arthasInstanceDTO = arthasInstanceService.findInstanceByChannelId(channelId)
            ?: throw BusinessException("Channel 不存在，请重新在列表中连接")
        val distributedLockKey = "arthas:channel:join-lock:${ownerIdentifier}"

        val consumerCacheKey = "channel:consumer:${channelId}:${ownerIdentifier}"
        // 并发概率不高，先这样简单写，主要是防止前端 react 开发模式同时发两次请求
        joinLock.lock(distributedLockKey)
        try {
            cache[consumerCacheKey]?.get()?.let {
                return it as ArthasConsumerDTO
            }

            val pair = arthasInstanceService.resolveCachedClientByChannelId(arthasInstanceDTO.channelId)
            var client = pair?.first
            if (client == null) {
                val newClient = createClient(arthasInstanceDTO)
                clientInitMap.remove(resolveJvmId(arthasInstanceDTO.runtimeNodeId, arthasInstanceDTO.jvm))
                client = newClient
            }
            var consumer: ArthasConsumerDTO
            try {
                consumer = ArthasConsumerDTO(
                    client.joinSession(arthasInstanceDTO.sessionId).consumerId,
                    arthasInstanceDTO.jvm.name
                )
            } catch (_: SessionNotFoundException) {
                // arthas 自己关了会话
                val initSession = client.initSession()
                arthasInstanceService.updateArthasInstance(ArthasInstancePO().apply {
                    id = arthasInstanceDTO.id
                    sessionId = initSession.sessionId
                })
                consumer = ArthasConsumerDTO(
                    initSession.consumerId,
                    arthasInstanceDTO.jvm.name
                )
            }
            // 用于解决创建期间的并发，该方法返回后，相关数据会保存到用户自己的 session 中，这里的数据就没必要了
            cache.put(consumerCacheKey, consumer)
            return consumer
        } finally {
            joinLock.unlock(distributedLockKey)
        }
    }

    private fun createClient(
        arthasInstanceDTO: ArthasInstanceDTO,
    ): ArthasHttpClient {
        val extPoint = runtimeNodeService.findPluginById(arthasInstanceDTO.extPointId)
        val runtimeNode = runtimeNodeService.connect(arthasInstanceDTO.runtimeNodeId)

        val bundle = toolchainService.resolveToolchainBundle(arthasInstanceDTO.bundleId) ?: TODO("bundle not found.")
        val handler = extPoint.createAttachHandler(runtimeNode, arthasInstanceDTO.jvm, bundle)
        val httpClient = handler.attach(arthasInstanceDTO.boundPort, arthasInstanceDTO.endpointPassword)
        if (httpClient.getPort() != arthasInstanceDTO.boundPort) {
            arthasInstanceService.updateArthasInstance(ArthasInstancePO().apply {
                id = arthasInstanceDTO.id
                boundPort = httpClient.getPort()
            })
        }
        return httpClient
    }

    private fun generatePassword(): String {
        return SecureRandomFactory.randomString(32)
    }

    /**
     * 异步 attach 到 jvm
     *
     * 该方法会设置 [ArthasInstanceDTO]，主要用于保存最终连接的端口
     */
    private fun attachJvmAsync(
        runtimeNodeDto: RuntimeNodeDTO,
        jvm: Jvm,
        holder: ArthasClientInitStatus,
        bundleId: Long,
        treeNodeId: String,
    ) {
        executor.execute {
            val lockKey = arthasInitDistributedLockKey(runtimeNodeDto.id)
            if (!joinLock.tryLock(lockKey)) {
                return@execute
            }

            ProgressReportHolder.startProgress(holder.progressManager)
            logger.info("Start creating new http client for jvm(id = {}), name = {}", jvm.id, jvm.name)
            try {
                val channelData = arthasInstanceService.resolveCachedClient(treeNodeId)
                if (channelData != null && channelData.first != null) {
                    return@execute
                }

                val bundle = toolchainService.resolveToolchainBundle(bundleId) ?: TODO("bundle not found.")

                val runtimeNode = runtimeNodeService.connect(runtimeNodeDto.id)

                val handler = runtimeNode.getExtPoint().createAttachHandler(runtimeNode, jvm, bundle)
                var arthasInstance = arthasInstanceService.findInstanceById(treeNodeId)
                var password = arthasInstance?.endpointPassword ?: generatePassword()

                var client = if (arthasInstance == null) {
                    handler.attach(null, password)
                } else {
                    handler.attach(arthasInstance.boundPort, password)
                }

                logger.info("Successfully created client for jvm(id = {}), name = {}", jvm.id, jvm.name)


                if (arthasInstance == null) {
                    val session = client.initSession()
                    arthasInstanceService.save(
                        ArthasInstanceDTO(
                            treeNodeId,
                            holder.channelId,
                            password,
                            client.getPort(),
                            session.sessionId,
                            runtimeNodeDto.id,
                            runtimeNodeDto.restrictedMode,
                            bundleId,
                            runtimeNode.getExtPoint().getId(),
                            jvm,
                            Instant.now()
                        ), client
                    )
                } else if (client.getPort() != arthasInstance.boundPort) {
                    arthasInstanceService.updateArthasInstance(ArthasInstancePO().apply {
                        id = arthasInstance.id
                        boundPort = client.getPort()
                    })
                    arthasInstanceService.saveClient(arthasInstance, client)
                } else {
                    arthasInstanceService.saveClient(arthasInstance, client)
                }
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
                joinLock.unlock(lockKey)
                holder.clientInitLock.set(false)
                ProgressReportHolder.clear()
            }
        }
    }


    /**
     * 尝试获取 client，如果没有，则尝试创建一个新的
     */
    private fun tryResolveClient(channelId: String): Pair<ArthasHttpClient, ArthasInstanceDTO> {
        val pair = arthasInstanceService.resolveCachedClientByChannelId(channelId)
            ?: throw BusinessException("节点已过期，请刷新页面")
        pair.first?.let {
            return Pair(it, pair.second)
        }
        val client = createClient(pair.second)
        return Pair(client, pair.second)
    }

    private fun checkAndGetNode(channelId: String, commands: List<String>): Pair<ArthasHttpClient, ArthasInstanceDTO> {
        checkTreeNodePermission(channelId)
        checkCommandExecPermission(channelId, commands)
        val pair = tryResolveClient(channelId)
        if (pair.second.restrictedMode) {
            checkOgnlExpression(commands)
        }
        return pair
    }

    private fun deleteOldProfilerFiles(channelId: String, client: ArthasHttpClient) {
        val profilerFiles = listProfilerFiles(channelId)
        if (profilerFiles.size <= MAX_PROFILER_FILE_COUNT) {
            return
        }
        executor.execute {
            val lockKey = "profiler-cleaner:${channelId}"
            if (!joinLock.tryLock(lockKey)) {
                return@execute
            }
            try {
                val profilerFiles = listProfilerFiles0(channelId)
                if (profilerFiles.size <= MAX_PROFILER_FILE_COUNT) {
                    return@execute
                }
                val sortedBy = profilerFiles.sortedByDescending { f -> f.timestamp }
                var end = profilerFiles.size - MAX_PROFILER_FILE_COUNT
                for (i in 0 until end) {
                    val filename = "${channelId}-${sortedBy[i].timestamp}.${sortedBy[i].extension}"
                    if (SecureUtils.isNotPureFilename(filename)) {
                        throw BusinessException("无效的文件名称")
                    }
                    client.deleteProfilerFile(filename)
                }
            } finally {
                joinLock.unlock(lockKey)
            }
        }

    }

    private fun beforeExec(instance: ArthasInstanceDTO, client: ArthasHttpClient, commands: MutableList<String>, sessionId: String?): JsonNode? {
        // 考虑抽离为一个接口?
        if (commands.isEmpty()) {
            return null
        }
        val cmd = commands[0]
        if ("profiler" == cmd && commands.size >= 2) {
            if ("stop" == commands[1]) {
                deleteOldProfilerFiles(instance.channelId, client)
            }
             when (commands[1]) {
                 "start", "collect", "dump", "stop" -> {
                     return client.execProfilerCommand("${instance.channelId}-${System.currentTimeMillis()}", commands, sessionId)
                 }
                 "execute" -> {
                     // TODO 替换输出文件路径
                     if (instance.restrictedMode) {
                         throw BusinessException("限制模式下不允许执行 profiler execute 命令")
                     }
                 }
             }
        }
        return null
    }

    override fun execAsync(channelId: String, command: String) {
        val commands = splitCommand(command)
        val pair = checkAndGetNode(channelId, commands)
        beforeExec(pair.second, pair.first, commands, pair.second.sessionId)?.let {
            return
        }
        pair.first.execAsync(pair.second.sessionId, command)
    }


    override fun execSync(channelId: String, command: String): JsonNode {
        val commands = splitCommand(command)
        val pair = checkAndGetNode(channelId, commands)
        beforeExec(pair.second, pair.first, commands, null)?.let {
            return it
        }
        return pair.first.exec(command)
    }


    fun checkOgnlExpression(commands: List<String>) {
        // Ognl 和 SpEL 差不多的
        for (command in commands) {
            if (!(command[0] == '\'' || command[0] == '"')) {
                continue
            }
            if (command.length <= 2) {
                continue
            }
            val expression = try {
                parser.parseExpression(command.substring(1, command.length - 1)) as SpelExpression
            } catch (_: Exception) {
                throw BusinessException("error.ognl.parse.failed")
            }
            validateAst(expression.ast)
        }
    }


    /**
     * **AI GENERATED**:
     *
     * 帮我写一个 Kotlin 工具函数，这个函数输入一个字符串，你需要将这个字符串以空格分割后将这些子串以一个 `List<String>` 返回。但是需要注意:
     *
     * 1. 使用一对`'`或`"`包裹的字符串是一个整体，你不能将其分割，并且需要将 `'` 或 `"` 保留到输出中，不要省略。
     * 2. 可以使用 `\` 来对 `'` 或 `"` 进行转义
     *
     * ## 样例
     * ### 样例 1
     *
     * 输入: `hello "wo rld" '!! !!'`
     *
     * 输出: `[hello, "wo rld", '!! !!']`
     *
     * 解释: `"wo rld"` 和 `'!! !!'` 虽然中间有空格，但是它们被`"` 和 `'` 包裹了，是一个整体。
     *
     * ### 样例 2
     *
     * 输入: `hello "\"wo \"rld" '\\!!\'!!'`
     *
     * 输出: `[hello, ""wo "rld", '\!!'!!']`
     *
     * 解释: `\` 为转义符，`\"` 或 `\'` 不应该视为开始或结束的标志
     *
     * ### 样例 3
     *
     * 输入: `I "love 'you'"`
     *
     * 输出: `[I, "love 'you'"]`
     *
     * 解释: 虽然 `you` 被单引号包裹，但是它已经被双引号包裹了，所以需要将其当做普通的单引号
     *
     * ### 样例 4
     *
     * 输入: `    hello     world     `
     *
     * 输出: `[hello, world]`
     *
     * 解释: 对于多个空格要进行忽略
     *
     * ### 样例 5
     *
     * 输入: `hello 'my beautiful "world`
     *
     * 输出: `[hello, 'my beautiful "world]`
     *
     * 解释: 当你开始匹配一个子串时，如果没有匹配到对应的符号，则将其整个视为一个子串
     *
     * ## 代码要去
     *
     * 1. 不要使用正则表达式，一个字符一个字符解析
     * 2. 未来不需要扩展，**保持代码简洁，不要考虑扩展性**
     *
     * @param input 需要解析的命令
     * @return 解析后的子串
     */
    fun splitCommand(input: String): MutableList<String> {
        val result = mutableListOf<String>()
        val current = StringBuilder()
        var quoteChar: Char? = null // 记录当前是否在引号内，以及是哪种引号 (' 或 ")
        var isEscaped = false      // 记录当前字符是否被转义

        for (char in input) {
            when {
                // 1. 处理转义逻辑
                isEscaped -> {
                    current.append(char)
                    isEscaped = false
                }

                char == '\\' -> {
                    current.append(char)
                    isEscaped = true
                }

                // 2. 处理引号逻辑
                quoteChar != null -> {
                    current.append(char)
                    if (char == quoteChar) {
                        quoteChar = null // 匹配到配对的引号，退出引用状态
                    }
                }

                char == '\'' || char == '"' -> {
                    quoteChar = char
                    current.append(char)
                }

                // 3. 处理空格和普通字符
                char.isWhitespace() -> {
                    if (current.isNotEmpty()) {
                        result.add(current.toString())
                        current.clear()
                    }
                }

                else -> current.append(char)
            }
        }

        // 处理最后一个残余的子串
        if (current.isNotEmpty()) {
            result.add(current.toString())
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


    override fun pullResults(channelId: String, consumerId: String): JsonNode {
        checkTreeNodePermission(channelId)
        val pair = tryResolveClient(channelId)
        return pair.first.pullResults(pair.second.sessionId, consumerId)
    }


    override fun interruptCommand(channelId: String) {
        checkTreeNodePermission(channelId)
        val pair = tryResolveClient(channelId)
        pair.first.interruptJob(pair.second.sessionId)
    }

    override fun retransform(channelId: String, source: BoundedInputStreamSource): JsonNode {
        checkCommandExecPermission(channelId, listOf("retransform"))
        val pair = tryResolveClient(channelId)

        return pair.first.retransform(source)
    }

    /**
     * 列出文件，移除了权限校验
     */
    fun listProfilerFiles0(channelId: String): List<ProfilerFile> {
        val pair = tryResolveClient(channelId)
        val files = pair.first.listProfilerFiles()

        return buildList {
            for (filename in files) {
                val i = filename.lastIndexOf('.')
                if (i < 0) {
                    continue
                }
                val ext = filename.substring(i + 1, filename.length)
                val tsPost = filename.lastIndexOf('-')
                if (tsPost < 0) {
                    continue
                }
                val timestamp = filename.substring(tsPost + 1, i)
                add(ProfilerFile(timestamp.toLong(), filename.substring(0, tsPost), ext))
            }
        }
    }

    override fun listProfilerFiles(channelId: String): List<ProfilerFile> {
        checkCommandExecPermission(channelId, listOf("profiler"))
        return listProfilerFiles0(channelId)
    }

    override fun readProfilerFile(file: ProfilerFile): BoundedInputStreamSource? {
        checkCommandExecPermission(file.channelId, listOf("profiler"))
        val pair = tryResolveClient(file.channelId)

        val filename = "${file.channelId}-${file.timestamp}.${file.extension}"
        if (SecureUtils.isNotPureFilename(filename)) {
            throw BusinessException("无效的文件名称")
        }
        return pair.first.readProfilerFile(filename)
    }


}
