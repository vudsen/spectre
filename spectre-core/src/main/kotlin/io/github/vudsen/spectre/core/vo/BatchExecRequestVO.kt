package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class BatchExecRequestVO {
    @NotEmpty
    var channelIds: List<String> = emptyList()

    @NotEmpty
    var command: String = ""
}
