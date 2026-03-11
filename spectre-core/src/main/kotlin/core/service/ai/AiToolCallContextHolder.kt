package io.github.vudsen.spectre.core.service.ai

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import org.springframework.security.core.context.SecurityContext
import org.springframework.stereotype.Component

@Component
class AiToolCallContextHolder {

    data class ToolCallContext(
        val conversationId: String,
        val channelId: String,
        val securityContext: SecurityContext?,
        val messages: MutableList<AiMessageDTO> = mutableListOf(),
    )

    private val local = ThreadLocal<ToolCallContext?>()

    fun open(conversationId: String, channelId: String, securityContext: SecurityContext?) {
        local.set(ToolCallContext(conversationId, channelId, securityContext))
    }

    fun current(): ToolCallContext? = local.get()

    fun requireContext(): ToolCallContext {
        return current() ?: throw IllegalStateException("AI tool context is not initialized")
    }

    fun emit(type: AiMessageDTO.MessageType, data: String, parameter: String? = null) {
        requireContext().messages.add(AiMessageDTO(type, data, parameter))
    }

    fun snapshotMessages(): List<AiMessageDTO> {
        return current()?.messages?.toList() ?: emptyList()
    }

    fun clear() {
        local.remove()
    }
}
