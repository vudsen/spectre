package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class BatchChannelsRequestVO {
    @NotEmpty
    var channelIds: List<String> = emptyList()
}
