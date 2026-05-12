package io.github.vudsen.spectre.core.integrate.ai

import io.github.vudsen.spectre.api.ai.AgentTool
import io.github.vudsen.spectre.api.ai.AiToolExecutionContext
import org.springframework.ai.tool.ToolCallback
import org.springframework.ai.tool.function.FunctionToolCallback
import java.util.function.Consumer

class AgentToolsManager(
    tools: List<AgentTool>,
) {

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
        return tool.execute(context, argument)
    }
}
