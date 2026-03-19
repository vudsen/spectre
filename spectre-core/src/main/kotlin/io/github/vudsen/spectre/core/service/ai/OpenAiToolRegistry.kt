package io.github.vudsen.spectre.core.service.ai

import com.openai.core.JsonValue
import com.openai.models.FunctionDefinition
import com.openai.models.FunctionParameters
import com.openai.models.chat.completions.ChatCompletionFunctionTool
import com.openai.models.chat.completions.ChatCompletionTool
import io.github.vudsen.spectre.api.exception.AppException
import org.springframework.security.core.context.SecurityContext

data class AiToolExecutionContext(
    val conversationId: String,
    val channelId: String,
    val securityContext: SecurityContext?,
)

sealed interface AiToolExecutionResult {
    data class Success(
        val output: String,
        val parameter: String? = null,
    ) : AiToolExecutionResult

    data class AskHuman(
        val requestJson: String,
    ) : AiToolExecutionResult
}

data class OpenAiToolDefinition(
    val name: String,
    val description: String,
    val parametersSchema: Map<String, Any>,
    val requiresConfirm: Boolean = false,
    val parameterResolver: (String) -> String? = { null },
    val executor: (AiToolExecutionContext, String) -> AiToolExecutionResult,
)

class OpenAiToolRegistry(
    toolDefinitions: List<OpenAiToolDefinition>,
) {
    private val definitionsByName: Map<String, OpenAiToolDefinition> = toolDefinitions.associateBy { it.name }

    private val openAiTools: List<ChatCompletionTool> =
        toolDefinitions.map { definition ->
            val functionParameters =
                FunctionParameters
                    .builder()
                    .putAllAdditionalProperties(
                        definition.parametersSchema
                            .mapValues { (_, value) -> JsonValue.from(value) },
                    ).build()

            val function =
                FunctionDefinition
                    .builder()
                    .name(definition.name)
                    .description(definition.description)
                    .parameters(functionParameters)
                    .build()

            ChatCompletionTool.ofFunction(
                ChatCompletionFunctionTool
                    .builder()
                    .function(function)
                    .build(),
            )
        }

    fun openAiTools(): List<ChatCompletionTool> = openAiTools

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
}
