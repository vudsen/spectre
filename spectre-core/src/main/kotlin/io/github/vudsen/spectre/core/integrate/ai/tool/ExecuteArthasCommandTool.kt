package io.github.vudsen.spectre.core.integrate.ai.tool

import io.github.vudsen.spectre.api.ai.AiToolExecutionContext
import io.github.vudsen.spectre.api.ai.TypedAgentTool
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.ChannelService
import io.github.vudsen.spectre.common.util.GLOBAL_JSON_MAPPER
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.task.TaskExecutor
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import tools.jackson.databind.node.ArrayNode
import tools.jackson.databind.node.IntNode
import tools.jackson.databind.node.JsonNodeFactory
import tools.jackson.databind.node.ObjectNode
import tools.jackson.databind.node.StringNode
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@Component
class ExecuteArthasCommandTool(
    private val arthasExecutionService: ArthasExecutionService,
    private val channelService: ChannelService,
    @param:Qualifier("applicationTaskExecutor") private val executor: TaskExecutor,
) : TypedAgentTool<ExecuteArthasCommandRequest>() {
    companion object {
        private val logger = LoggerFactory.getLogger(ExecuteArthasCommandTool::class.java)
    }

    override fun getName(): String = "execute_arthas_command"

    override fun getDescription(): String = "Execute arthas command"

    override fun getArgumentType(): Class<ExecuteArthasCommandRequest> = ExecuteArthasCommandRequest::class.java

    override fun executeInternal(
        context: AiToolExecutionContext,
        argument: ExecuteArthasCommandRequest,
    ): String {
        val channel =
            context.channelId.toLongOrNull()?.let {
                channelService.findById(it)
            }
        if (channel == null) {
            return arthasExecutionService.execSync(context.channelId, argument.command).toString()
        } else {
            val latch = CountDownLatch(channel.instanceIds.size)
            val securityContext = SecurityContextHolder.getContext()
            val batchResult: MutableMap<String, ArrayNode> = mutableMapOf()
            for (instanceId in channel.instanceIds) {
                executor.execute {
                    SecurityContextHolder.setContext(securityContext)
                    try {
                        batchResult[instanceId] = arthasExecutionService.execSync(instanceId, argument.command)
                    } catch (e: Exception) {
                        batchResult[instanceId] = errorResult(e)
                    } finally {
                        latch.countDown()
                    }
                }
            }
            if (!latch.await(3, TimeUnit.MINUTES)) {
                return "Pull result timeout!"
            }
            return GLOBAL_JSON_MAPPER.writeValueAsString(batchResult)
        }
    }

    fun exactErrorMsg(e: Exception): String =
        if (e is BusinessException) {
            e.toI18nMessage()
        } else {
            logger.error("", e)
            "Internal Server Error"
        }

    fun errorResult(e: Exception): ArrayNode {
        val node = ArrayNode(JsonNodeFactory.instance)
        node.add(createErrorMsg(exactErrorMsg(e)))
        return node
    }

    fun createErrorMsg(msg: String): ObjectNode =
        ObjectNode(JsonNodeFactory.instance).apply {
            this["type"] = StringNode("message")
            this["jobId"] = IntNode((System.currentTimeMillis() / 1000).toInt())
            this["message"] = StringNode(msg)
        }

    override fun requireUserConfirm(): Boolean = true
}
