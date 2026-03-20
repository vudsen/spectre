package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.api.AiTools
import io.github.vudsen.spectre.api.entity.AskHumanRequest
import io.github.vudsen.spectre.api.entity.ExecuteArthasCommandRequest
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.core.service.ai.AiToolExecutionContext
import io.github.vudsen.spectre.core.service.ai.AiToolExecutionResult
import io.github.vudsen.spectre.core.service.ai.OpenAiToolDefinition
import io.github.vudsen.spectre.core.service.ai.OpenAiToolRegistry
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.core.context.SecurityContextHolder
import tools.jackson.databind.ObjectMapper

@Configuration
class AiToolsConfiguration(
    private val arthasExecutionService: ArthasExecutionService,
) {
    private val objectMapper = ObjectMapper()

    @Bean
    fun openAiToolRegistry(): OpenAiToolRegistry =
        OpenAiToolRegistry(
            listOf(
                executeArthasCommandDefinition(),
                askHumanDefinition(),
            ),
        )

    private fun executeArthasCommandDefinition(): OpenAiToolDefinition =
        OpenAiToolDefinition(
            name = AiTools.EXECUTE_ARTHAS_COMMAND,
            description = "Execute arthas command",
            parametersSchema =
                mapOf(
                    "type" to "object",
                    "properties" to
                        mapOf(
                            "command" to
                                mapOf(
                                    "type" to "string",
                                    "description" to "Arthas command to execute",
                                ),
                        ),
                    "required" to listOf("command"),
                    "additionalProperties" to false,
                ),
            requiresConfirm = true,
            parameterResolver = { argumentsJson ->
                parseExecuteArthasCommandRequest(argumentsJson).command.trim()
            },
            executor = { context, argumentsJson ->
                executeArthasCommand(context, argumentsJson)
            },
        )

    private fun askHumanDefinition(): OpenAiToolDefinition =
        OpenAiToolDefinition(
            name = AiTools.ASK_HUMAN,
            description = "Ask user to provide missing information",
            parametersSchema =
                mapOf(
                    "type" to "object",
                    "properties" to
                        mapOf(
                            "question" to
                                mapOf(
                                    "type" to "string",
                                    "description" to "Question shown to user",
                                ),
                            "options" to
                                mapOf(
                                    "type" to "array",
                                    "description" to "Candidate options for user",
                                    "items" to mapOf("type" to "string"),
                                ),
                        ),
                    "required" to listOf("question"),
                    "additionalProperties" to false,
                ),
            parameterResolver = { argumentsJson ->
                normalizeAskHumanRequestJson(argumentsJson)
            },
            executor = { _, argumentsJson ->
                AiToolExecutionResult.AskHuman(normalizeAskHumanRequestJson(argumentsJson))
            },
        )

    private fun executeArthasCommand(
        context: AiToolExecutionContext,
        argumentsJson: String,
    ): AiToolExecutionResult {
        val request = parseExecuteArthasCommandRequest(argumentsJson)
        val command = request.command.trim()

        val oldContext = SecurityContextHolder.getContext()
        return try {
            context.securityContext?.let { SecurityContextHolder.setContext(it) }
            val result = arthasExecutionService.execSync(context.channelId, command)
            AiToolExecutionResult.Success(
                output = result.toString(),
                parameter = command,
            )
        } finally {
            SecurityContextHolder.setContext(oldContext)
        }
    }

    private fun parseExecuteArthasCommandRequest(argumentsJson: String): ExecuteArthasCommandRequest =
        objectMapper.readValue(argumentsJson, ExecuteArthasCommandRequest::class.java)

    private fun normalizeAskHumanRequestJson(argumentsJson: String): String {
        val request = objectMapper.readValue(argumentsJson, AskHumanRequest::class.java)
        return objectMapper.writeValueAsString(request)
    }
}
