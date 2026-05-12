package io.github.vudsen.spectre.core.integrate.ai

import io.github.vudsen.spectre.api.AgentEventPublisher
import io.github.vudsen.spectre.api.dto.AiMessageDTO
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

    override fun onToolCallStart(
        toolName: String,
        arguments: String?,
    ) {
        sseEmitter.send(
            AiMessageDTO(
                AiMessageDTO.MessageType.TOOL_CALL_START,
                toolName,
                arguments,
            ),
        )
    }

    override fun onToolCallEnd(
        toolName: String,
        result: String,
    ) {
        sseEmitter.send(AiMessageDTO(AiMessageDTO.MessageType.TOOL_CALL_END, toolName, result))
    }

    override fun onError(
        e: Exception?,
        msg: String,
    ) {
        sseEmitter.send(AiMessageDTO(AiMessageDTO.MessageType.ERROR, msg))
    }

    override fun askHuman(question: String) {
        sseEmitter.send(AiMessageDTO(AiMessageDTO.MessageType.ASK_HUMAN, question))
    }

    override fun sendPendingConfirm(
        toolName: String,
        arguments: String?,
    ) {
        sseEmitter.send(AiMessageDTO(AiMessageDTO.MessageType.PENDING_CONFIRM, toolName, arguments))
    }

    override fun done() {
        sseEmitter.complete()
    }
}
