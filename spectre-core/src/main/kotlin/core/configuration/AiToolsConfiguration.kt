package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.api.AiTools
import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.entity.AskHumanRequest
import io.github.vudsen.spectre.api.entity.ExecuteArthasCommandRequest
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.core.service.ai.AiConversationStateStore
import io.github.vudsen.spectre.core.service.ai.AiToolCallContextHolder
import io.github.vudsen.spectre.core.service.ai.AskHumanInterruptedException
import io.github.vudsen.spectre.core.service.ai.PendingConfirmInterruptedException
import io.github.vudsen.spectre.core.service.ai.PendingConfirmToolService
import org.springframework.ai.tool.ToolCallback
import org.springframework.ai.tool.function.FunctionToolCallback
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Description
import org.springframework.security.core.context.SecurityContextHolder
import tools.jackson.databind.JsonNode
import java.util.UUID

@Configuration
class AiToolsConfiguration(
    private val arthasExecutionService: ArthasExecutionService,
    private val aiConversationStateStore: AiConversationStateStore,
    private val aiToolCallContextHolder: AiToolCallContextHolder,
    private val pendingConfirmToolService: PendingConfirmToolService,
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
        val toolCallId = UUID.randomUUID().toString()
        val toolArguments = "{\"command\":\"${escapeJson(cmd)}\"}"

        aiConversationStateStore.appendAssistantToolCallMessage(
            conversationId = ctx.conversationId,
            toolCallId = toolCallId,
            toolName = AiTools.EXECUTE_ARTHAS_COMMAND,
            toolArguments = toolArguments,
        )

        aiToolCallContextHolder.emit(
            AiMessageDTO.MessageType.TOOL_CALL_START,
            AiTools.EXECUTE_ARTHAS_COMMAND,
            cmd
        )

        if (pendingConfirmToolService.requiresConfirm(AiTools.EXECUTE_ARTHAS_COMMAND)) {
            aiConversationStateStore.savePendingToolConfirm(
                conversationId = ctx.conversationId,
                toolCallId = toolCallId,
                toolName = AiTools.EXECUTE_ARTHAS_COMMAND,
                toolArguments = toolArguments,
                parameter = cmd,
                channelId = ctx.channelId,
            )
            aiToolCallContextHolder.emit(
                AiMessageDTO.MessageType.PENDING_CONFIRM,
                AiTools.EXECUTE_ARTHAS_COMMAND,
                cmd
            )
            throw PendingConfirmInterruptedException()
        }

        val old = SecurityContextHolder.getContext()
        try {
            ctx.securityContext?.let { SecurityContextHolder.setContext(it) }
            val result = arthasExecutionService.execSync(ctx.channelId, cmd)
            aiConversationStateStore.appendToolResponseMessage(
                conversationId = ctx.conversationId,
                toolCallId = toolCallId,
                toolName = AiTools.EXECUTE_ARTHAS_COMMAND,
                responseData = result.toString(),
            )
            result
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

    private fun escapeJson(text: String): String {
        return text
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
    }
}
