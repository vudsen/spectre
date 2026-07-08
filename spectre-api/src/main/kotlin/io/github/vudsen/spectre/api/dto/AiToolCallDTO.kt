package io.github.vudsen.spectre.api.dto

data class AiToolCallDTO(
    val toolCallId: String,
    val toolName: String,
    val arguments: String? = null,
    val status: AiToolCallStatus,
)

enum class AiToolCallStatus {
    PENDING_EXECUTION,
    PENDING_CONFIRM,
}
