package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.*
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.api.perm.ABACPermissions
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.api.service.ToolchainService
import io.github.vudsen.spectre.common.progress.ProgressReportHolder
import io.github.vudsen.spectre.core.bean.ArthasClientInitStatus
import io.github.vudsen.spectre.core.bean.ArthasClientWrapper
import io.github.vudsen.spectre.core.configuration.constant.CacheConstant
import io.github.vudsen.spectre.core.integrate.abac.ArthasExecutionABACContext
import io.github.vudsen.spectre.core.integrate.abac.AttachNodeABACContext
import io.github.vudsen.spectre.core.internal.ArthasClientCacheService
import io.github.vudsen.spectre.core.lock.InMemoryDistributedLock
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.cache.CacheManager
import org.springframework.core.io.InputStreamSource
import org.springframework.core.task.TaskExecutor
import org.springframework.expression.spel.SpelNode
import org.springframework.expression.spel.ast.*
import org.springframework.expression.spel.standard.SpelExpression
import org.springframework.expression.spel.standard.SpelExpressionParser
import org.springframework.stereotype.Service
import java.lang.reflect.InvocationTargetException
import java.util.concurrent.locks.ReentrantLock


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
    cacheManager: CacheManager,
    @param:Qualifier("applicationTaskExecutor") private val executor: TaskExecutor,
    private val arthasClientCacheService: ArthasClientCacheService,
    private val runtimeNodeService: RuntimeNodeService,
    private val toolchainService: ToolchainService,
    private val appAccessControlService: AppAccessControlService
) : ArthasExecutionService {

    companion object {
        private val logger = LoggerFactory.getLogger(DefaultArthasExecutionService::class.java)
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
        private val DISALLOWED_ARTHAS_COMMAND = setOf("auth", "cat", "base64", "cls", "dump", "grep", "keymap", "mc", "quit", "pwd", "tee")
    }

    private val modifyLock = ReentrantLock()

    private val joinLock = InMemoryDistributedLock()

    private val cache = cacheManager.getCache(CacheConstant.DEFAULT_CACHE_KEY)!!


    private fun resolveJvmId(runtimeNodeId: Long, jvm: Jvm): String {
        return "${runtimeNodeId}:${jvm.hashCode()}"
    }

    private fun checkTreeNodePermission(channelId: String) {
        val info = getChannelInfo(channelId) ?: throw BusinessException("error.channel.not.exist")
        checkTreeNodePermission(info.runtimeNodeId, info.treeNodeId)
    }

    private fun checkTreeNodePermission(runtimeNodeId: Long, treeNodeId: String) {
        val treeNode = runtimeNodeService.findTreeNode(treeNodeId) ?: throw BusinessException("节点不存在")
        val node = runtimeNodeService.findPureRuntimeNodeById(runtimeNodeId) ?: throw BusinessException("运行节点不存在")
        val ctx = AttachNodeABACContext(ABACPermissions.RUNTIME_NODE_ATTACH, node, treeNode)
        appAccessControlService.checkPolicyPermission(ctx)
    }

    private fun checkCommandExecPermission(channelId: String, commands: List<String>) {
        if (DISALLOWED_ARTHAS_COMMAND.contains(commands[0])) {
            throw BusinessException("error.command.not.allowed", arrayOf(commands[0]))
        }
        val info = getChannelInfo(channelId) ?: throw BusinessException("error.channel.not.exist")
        val runtimeNodeDTO = runtimeNodeService.findPureRuntimeNodeById(info.runtimeNodeId) ?: throw BusinessException("节点不存在")

        appAccessControlService.checkPolicyPermission(
            ArthasExecutionABACContext(
                ABACPermissions.RUNTIME_NODE_ARTHAS_EXECUTE,
                commands,
                runtimeNodeDTO,
                info.jvm
            )
        )
    }


    override fun requireAttach(
        runtimeNodeId: Long,
        treeNodeId: String,
        bundleId: Long,
    ): AttachStatus {
        checkTreeNodePermission(runtimeNodeId, treeNodeId)

        val runtimeNodeDto =
            runtimeNodeService.findPureRuntimeNodeById(runtimeNodeId) ?: throw BusinessException("error.runtime.node.not.exist")

        val node = runtimeNodeService.findTreeNode(treeNodeId) ?: throw NamedExceptions.SESSION_EXPIRED.toException()
        val jvm = runtimeNodeService.deserializeToJvm(runtimeNodeDto.pluginId, node)
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
        // 除非使用 redis，不然每次重启都会丢失数据
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("Channel 已经关闭，请重新在列表中连接")
        val distributedLockKey = "arthas:channel:join-lock:${ownerIdentifier}"

        val consumerCacheKey = "channel:consumer:${channelId}:${ownerIdentifier}"
        // 并发概率不高，先这样简单写，主要是防止前端 react 开发模式同时发两次请求
        joinLock.lock(distributedLockKey)
        try {
            cache[consumerCacheKey]?.get() ?.let {
                return it as ArthasConsumerDTO
            }

            val jvmId = resolveJvmId(data.runtimeNodeId, data.jvm)
            var client = arthasClientCacheService.resolveCachedClient(jvmId)?.client
            if (client == null) {
                modifyLock.lock()
                try {
                    val newClient = createClient(data, data)
                    // 本地未缓存，但是缓存有，一般大概率出现在集群环境
                    arthasClientCacheService.saveClient(jvmId, ArthasClientWrapper(newClient, channelId))
                    client = newClient
                } finally {
                    modifyLock.unlock()
                }
            }
            val session = ArthasConsumerDTO(client.joinSession(data.sessionId).consumerId, data.jvm.name)
            // 用于解决创建期间的并发，该方法返回后，相关数据会保存到用户自己的 session 中，这里的数据就没必要了
            cache.put(consumerCacheKey, session)
            return session
        } finally {
            joinLock.unlock(distributedLockKey)
        }
    }

    private fun createClient(
        info: ArthasChannelDTO,
        metadata: ArthasChannelDTO
    ): ArthasHttpClient {
        val extPoint = runtimeNodeService.findPluginById(metadata.extPointId)
        val runtimeNode = runtimeNodeService.connect(info.runtimeNodeId)

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
                val channelData = resolveArthasChannel(holder.channelId)
                if (channelData != null) {
                    return@execute
                }

                val bundle = toolchainService.resolveToolchainBundle(bundleId) ?: TODO("bundle not found.")

                val runtimeNode = runtimeNodeService.connect(runtimeNodeDto.id)

                val handler = runtimeNode.getExtPoint().createAttachHandler(runtimeNode, jvm, bundle)
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
                    runtimeNode.getExtPoint().getId()
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
                joinLock.unlock(lockKey)
                holder.clientInitLock.set(false)
                ProgressReportHolder.clear()
            }
        }
    }

    private fun resolveArthasChannel(channelId: String): ArthasChannelDTO? {
        cache["arthas:channel:${channelId}"]?.get() ?.let {
            return it as ArthasChannelDTO
        }
        return null
    }

    private fun saveChannelDTO(channelId: String, data: ArthasChannelDTO) {
        cache.putIfAbsent("arthas:channel:${channelId}", data)
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
        checkTreeNodePermission(channelId)
        val commands = splitCommand(command)
        checkCommandExecPermission(channelId, commands)
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)
        if (data.restrictedMode) {
            checkOgnlExpression(commands)
        }
        client.asyncExec(data.sessionId, command)
    }

    override fun execSync(channelId: String, command: String): Any {
        checkTreeNodePermission(channelId)
        val commands = splitCommand(command)
        checkCommandExecPermission(channelId, commands)
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)
        if (data.restrictedMode) {
            checkOgnlExpression(commands)
        }
        return client.exec(command)
    }


    fun checkOgnlExpression(commands: List<String>) {
        // Ognl 和 SpEL 差不多的
        for (command in commands) {
            if (!(command[0] == '\'' || command[0] == '"')) {
                continue
            }
            val expression = try {
                parser.parseExpression(command) as SpelExpression
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
     * 1. 使用一对`'`或`"`包裹的字符串是一个整体，你不能将其分割。
     * 2. 可以使用 `\` 来对 `'` 或 `"` 进行转义
     *
     * ## 样例
     * ### 样例 1
     *
     * 输入: `hello "wo rld" '!! !!'`
     *
     * 输出: `[hello, wo rld, !! !!]`
     *
     * 解释: `"wo rld"` 和 `'!! !!'` 虽然中间有空格，但是它们被`"` 和 `'` 包裹了，是一个整体。
     *
     * ### 样例 2
     *
     * 输入: `hello "\"wo \"rld" '\\!!\'!!'`
     *
     * 输出: `[hello, "wo "rld, \!!'!!]`
     *
     * 解释: `\` 为转义符，`\"` 或 `\'` 不应该视为开始或结束的标志
     *
     * ### 样例 3
     *
     * 输入: `I "love 'you'"`
     *
     * 输出: `[I, love 'you']`
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
     * 输出: `[hello, my beautiful "world]`
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
    fun splitCommand(input: String): List<String> {
        val result = mutableListOf<String>()
        val currentToken = StringBuilder()
        var i = 0
        var quoteChar: Char? = null // 用于记录当前是被 ' 还是 " 包裹

        while (i < input.length) {
            val c = input[i]

            when {
                // 情况 1: 处理转义字符 \
                c == '\\' && i + 1 < input.length -> {
                    currentToken.append(input[i + 1])
                    i += 1 // 跳过下一个被转义的字符
                }

                // 情况 2: 处理引号 (只有当不在另一种引号包裹中时才起作用)
                (c == '"' || c == '\'') -> {
                    when {
                        quoteChar == null -> quoteChar = c // 进入引号包裹模式
                        quoteChar == c -> quoteChar = null // 退出引号包裹模式
                        else -> currentToken.append(c)     // 在双引号里遇到单引号（或反之），视为普通字符
                    }
                }

                // 情况 3: 处理空格
                c.isWhitespace() -> {
                    if (quoteChar == null) {
                        if (currentToken.isNotEmpty()) {
                            result.add(currentToken.toString())
                            currentToken.setLength(0)
                        }
                    } else {
                        currentToken.append(c) // 在引号包裹中，空格视为普通字符
                    }
                }

                // 情况 4: 普通字符
                else -> currentToken.append(c)
            }
            i++
        }

        // 处理最后一个存留在 buffer 中的字符串
        if (currentToken.isNotEmpty()) {
            result.add(currentToken.toString())
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
        checkTreeNodePermission(channelId)
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)
        return client.pullResults(data.sessionId, consumerId)
    }

    override fun getChannelInfo(channelId: String): ArthasChannelDTO? {
        return resolveArthasChannel(channelId)
    }

    override fun interruptCommand(channelId: String) {
        checkTreeNodePermission(channelId)
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)
        client.interruptJob(data.sessionId)
    }

    override fun retransform(channelId: String, source: InputStreamSource): Any {
        checkCommandExecPermission(channelId, listOf("retransform"))
        val data = resolveArthasChannel(channelId) ?: throw BusinessException("会话过期，请刷新页面")
        val client = tryResolveClient(data, channelId)

        return client.retransform(source)
    }


}