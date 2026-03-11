package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class AiChatRequestVO {

    @NotEmpty
    var query: String = ""

    @NotEmpty
    var channelId: String = ""

    @NotEmpty
    var conversationId: String = ""
}
