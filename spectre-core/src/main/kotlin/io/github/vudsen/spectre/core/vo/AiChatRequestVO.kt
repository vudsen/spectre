package io.github.vudsen.spectre.core.vo

import io.github.vudsen.spectre.api.dto.AiToolResponseDTO
import jakarta.validation.constraints.NotEmpty

class AiChatRequestVO {
    var query: String = ""

    @NotEmpty
    var channelId: String = ""

    @NotEmpty
    var conversationId: String = ""

    var skillId: String? = null

    var toolResponses: List<AiToolResponseDTO> = emptyList()
}
