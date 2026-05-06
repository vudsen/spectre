package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.api.AiTools
import io.github.vudsen.spectre.api.entity.AskHumanRequest
import io.github.vudsen.spectre.api.entity.ExecuteArthasCommandRequest
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.core.service.ai.AiToolDefinition
import io.github.vudsen.spectre.core.service.ai.AiToolExecutionContext
import io.github.vudsen.spectre.core.service.ai.AiToolExecutionResult
import io.github.vudsen.spectre.core.service.ai.AiToolRegistry
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
    fun aiToolRegistry(): AiToolRegistry =
        AiToolRegistry(
            listOf(
                executeArthasCommandDefinition(),
                askHumanDefinition(),
            ),
        )

    private fun executeArthasCommandDefinition(): AiToolDefinition =
        AiToolDefinition(
            name = AiTools.EXECUTE_ARTHAS_COMMAND,
            description = "Execute arthas command",
            requiresConfirm = true,
            parameterResolver = { argumentsJson ->
                parseExecuteArthasCommandRequest(argumentsJson).command.trim()
            },
            callback = AiToolRegistry.executeArthasToolCallback("Execute arthas command"),
            executor = { context, argumentsJson ->
                executeArthasCommand(context, argumentsJson)
            },
        )

    private fun askHumanDefinition(): AiToolDefinition =
        AiToolDefinition(
            name = AiTools.ASK_HUMAN,
            description = "Ask user to provide missing information",
            parameterResolver = { argumentsJson ->
                normalizeAskHumanRequestJson(argumentsJson)
            },
            callback = AiToolRegistry.askHumanToolCallback("Ask user to provide missing information"),
            executor = { _, argumentsJson ->
                AiToolExecutionResult(output = normalizeAskHumanRequestJson(argumentsJson))
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
            AiToolExecutionResult(
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
