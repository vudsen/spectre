package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class BatchExecRequestVO {
    @NotEmpty
    var channelId: String = ""

    @NotEmpty
    var command: String = ""
}
