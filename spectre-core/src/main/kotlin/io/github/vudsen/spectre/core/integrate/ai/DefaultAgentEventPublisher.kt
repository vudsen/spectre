package io.github.vudsen.spectre.core.integrate.ai

import io.github.vudsen.spectre.api.AgentEventPublisher
import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.AiToolCallDTO
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

class DefaultAgentEventPublisher(
    private val sseEmitter: SseEmitter,
) : AgentEventPublisher {
    override fun onMessage(content: String) {
        sseEmitter.send(
            AiMessageDTO(
                AiMessageDTO.MessageType.TOKEN,
                content,
            ),
        )
    }

    override fun onToolCallsStart(toolCalls: List<AiToolCallDTO>) {
        sseEmitter.send(
            AiMessageDTO(
                AiMessageDTO.MessageType.TOOL_CALLS_START,
                "",
                toolCalls = toolCalls,
            ),
        )
    }

    override fun onToolCallEnd(
        toolCallId: String,
        toolName: String,
        result: String,
    ) {
        sseEmitter.send(
            AiMessageDTO(
                AiMessageDTO.MessageType.TOOL_CALL_END,
                toolName,
                result,
                toolCallId = toolCallId,
            ),
        )
    }

    override fun onError(
        e: Exception?,
        msg: String,
    ) {
        sseEmitter.send(AiMessageDTO(AiMessageDTO.MessageType.ERROR, msg))
    }

    override fun done() {
        sseEmitter.complete()
    }
}
