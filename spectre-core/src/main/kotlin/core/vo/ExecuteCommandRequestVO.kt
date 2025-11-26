package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class ExecuteCommandRequestVO {
    @NotEmpty
    var command: String = ""
}