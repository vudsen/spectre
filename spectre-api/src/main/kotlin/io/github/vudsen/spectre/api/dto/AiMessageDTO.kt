package io.github.vudsen.spectre.api.dto

class AiMessageDTO(
    val type: MessageType,
    val data: String,
    val parameter: String? = null,
    val toolCallId: String? = null,
    val toolCalls: List<AiToolCallDTO>? = null,
) {
    enum class MessageType {
        TOKEN,
        TOOL_CALLS_START,
        TOOL_CALL_END,
        ERROR,
    }
}
