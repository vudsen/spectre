package io.github.vudsen.spectre.core.service.ai

import io.github.vudsen.spectre.api.entity.AskHumanRequest
import io.github.vudsen.spectre.api.entity.ExecuteArthasCommandRequest
import io.github.vudsen.spectre.api.exception.AppException
import org.springframework.ai.tool.ToolCallback
import org.springframework.ai.tool.function.FunctionToolCallback
import org.springframework.security.core.context.SecurityContext

data class AiToolExecutionContext(
    val conversationId: String,
    val channelId: String,
    val securityContext: SecurityContext?,
)

data class AiToolExecutionResult(
    val output: String,
    val parameter: String? = null,
)

data class AiToolCall(
    val id: String,
    val name: String,
    val arguments: String,
)

data class AiToolDefinition(
    val name: String,
    val description: String,
    val requiresConfirm: Boolean = false,
    val parameterResolver: (String) -> String? = { null },
    val callback: ToolCallback,
    val executor: (AiToolExecutionContext, String) -> AiToolExecutionResult,
)

class AiToolRegistry(
    toolDefinitions: List<AiToolDefinition>,
) {
    private val definitionsByName: Map<String, AiToolDefinition> = toolDefinitions.associateBy { it.name }

    private val toolCallbacks: Array<ToolCallback> = toolDefinitions.map { it.callback }.toTypedArray()

    fun toolCallbacks(): Array<ToolCallback> = toolCallbacks

    fun requiresConfirm(toolName: String): Boolean = definitionsByName[toolName]?.requiresConfirm ?: false

    fun resolveParameter(
        toolName: String,
        argumentsJson: String,
    ): String? = definitionsByName[toolName]?.parameterResolver?.invoke(argumentsJson)

    fun execute(
        toolName: String,
        context: AiToolExecutionContext,
        argumentsJson: String,
    ): AiToolExecutionResult {
        val definition =
            definitionsByName[toolName]
                ?: throw AppException("Unsupported tool: $toolName")
        return definition.executor.invoke(context, argumentsJson)
    }

    companion object {
        fun askHumanToolCallback(description: String): ToolCallback =
            FunctionToolCallback
                .builder("askHuman") { request: AskHumanRequest ->
                    request.question
                }.description(description)
                .inputType(AskHumanRequest::class.java)
                .build()

        fun executeArthasToolCallback(description: String): ToolCallback =
            FunctionToolCallback
                .builder("executeArthasCommand") { request: ExecuteArthasCommandRequest ->
                    request.command
                }.description(description)
                .inputType(ExecuteArthasCommandRequest::class.java)
                .build()
    }
}
