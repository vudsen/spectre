package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.api.AiTools
import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.entity.AskHumanRequest
import io.github.vudsen.spectre.api.entity.ExecuteArthasCommandRequest
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.core.service.ai.AiConversationStateStore
import io.github.vudsen.spectre.core.service.ai.AiToolCallContextHolder
import io.github.vudsen.spectre.core.service.ai.AskHumanInterruptedException
import org.springframework.ai.tool.ToolCallback
import org.springframework.ai.tool.function.FunctionToolCallback
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Description
import org.springframework.security.core.context.SecurityContextHolder
import tools.jackson.databind.JsonNode

@Configuration
class AiToolsConfiguration(
    private val arthasExecutionService: ArthasExecutionService,
    private val aiConversationStateStore: AiConversationStateStore,
    private val aiToolCallContextHolder: AiToolCallContextHolder,
) {

    @Bean
    fun executeArthasCommandToolCallback(executeArthasCommand: (ExecuteArthasCommandRequest) -> JsonNode): ToolCallback {
        return FunctionToolCallback.builder(AiTools.EXECUTE_ARTHAS_COMMAND, executeArthasCommand)
            .description("Execute arthas command")
            .inputType(ExecuteArthasCommandRequest::class.java)
            .build()
    }

    @Bean
    @Description("Execute arthas command")
    fun executeArthasCommand(): (ExecuteArthasCommandRequest) -> JsonNode = { request ->
        val ctx = aiToolCallContextHolder.requireContext()
        val cmd = request.command.trim()

        aiToolCallContextHolder.emit(
            AiMessageDTO.MessageType.TOOL_CALL_START,
            AiTools.EXECUTE_ARTHAS_COMMAND,
            cmd
        )

        val old = SecurityContextHolder.getContext()
        try {
            ctx.securityContext?.let { SecurityContextHolder.setContext(it) }
            arthasExecutionService.execSync(ctx.channelId, cmd)
        } finally {
            aiToolCallContextHolder.emit(
                AiMessageDTO.MessageType.TOOL_CALL_END,
                AiTools.EXECUTE_ARTHAS_COMMAND,
                cmd
            )
            SecurityContextHolder.setContext(old)
        }
    }

    @Bean
    fun askHumanToolCallback(askHuman: (AskHumanRequest) -> String): ToolCallback {
        return FunctionToolCallback.builder(AiTools.ASK_HUMAN, askHuman)
            .description("Ask human for response")
            .inputType(AskHumanRequest::class.java)
            .build()
    }

    @Bean
    @Description("Ask human for response")
    fun askHuman(): (AskHumanRequest) -> String = { request ->
        val ctx = aiToolCallContextHolder.requireContext()

        aiToolCallContextHolder.emit(
            AiMessageDTO.MessageType.TOOL_CALL_START,
            AiTools.ASK_HUMAN,
            request.options.joinToString(",")
        )

        aiConversationStateStore.savePendingAskHuman(ctx.conversationId, request)

        aiToolCallContextHolder.emit(
            AiMessageDTO.MessageType.ASK_HUMAN,
            "Please provide additional information",
            request.options.joinToString(",")
        )

        throw AskHumanInterruptedException()
    }
}
