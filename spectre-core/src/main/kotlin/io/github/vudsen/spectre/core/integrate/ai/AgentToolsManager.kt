package io.github.vudsen.spectre.core.integrate.ai

import io.github.vudsen.spectre.api.ai.AgentTool
import io.github.vudsen.spectre.api.ai.AiToolExecutionContext
import io.github.vudsen.spectre.api.exception.BusinessException
import org.slf4j.LoggerFactory
import org.springframework.ai.tool.ToolCallback
import org.springframework.ai.tool.function.FunctionToolCallback
import java.util.function.Consumer

class AgentToolsManager(
    tools: List<AgentTool>,
) {
    companion object {
        @JvmStatic
        private val logger = LoggerFactory.getLogger(AgentToolsManager::class.java)
    }

    private val toolMap: Map<String, AgentTool> =
        buildMap {
            for (tool in tools) {
                put(tool.getName(), tool)?.let {
                    throw IllegalStateException("Duplicated tool name: ${tool.getName()}")
                }
            }
        }

    private val toolCallbacks: List<ToolCallback> =
        buildList {
            for (tool in tools) {
                add(
                    FunctionToolCallback
                        .builder(
                            tool.getName(),
                            Consumer<String> { throw IllegalStateException("Tool call only supports execute manually") },
                        ).inputType(tool.getArgumentType())
                        .description(tool.getDescription())
                        .build(),
                )
            }
        }

    fun toolCallbacks(): List<ToolCallback> = toolCallbacks

    fun isRequireConfirm(toolName: String): Boolean = toolMap[toolName]!!.requireUserConfirm()

    fun executeTool(
        context: AiToolExecutionContext,
        toolName: String,
        argument: String,
    ): String {
        val tool = toolMap[toolName] ?: throw IllegalStateException("Tool $toolName not found")
        try {
            return tool.execute(context, argument)
        } catch (e: Exception) {
            if (e is BusinessException) {
                return e.toI18nMessage()
            }
            logger.error("", e)
            return "System Error: " + e.message
        }
    }
}
