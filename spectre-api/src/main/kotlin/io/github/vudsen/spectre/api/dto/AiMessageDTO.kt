package io.github.vudsen.spectre.api.dto

class AiMessageDTO(
    val type: MessageType,
    val data: String,
    val parameter: String? = null
) {

    enum class MessageType {
        TOKEN,
        TOOL_CALL_START,
        /**
         * 等待用户确认
         */
        PENDING_CONFIRM,
        TOOL_CALL_END,
        ASK_HUMAN,
        ERROR
    }


}

