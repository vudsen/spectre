package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class InterruptRequestVO {
    @NotEmpty
    var instanceIds: List<String> = emptyList()
}
