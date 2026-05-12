package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.repo.entity.ToolchainType
import jakarta.validation.constraints.NotEmpty

class CreateToolchainItemDTO {
    var type: ToolchainType = ToolchainType.ARTHAS

    @NotEmpty
    var tag: String = ""

    /**
     * x86 url
     */
    @NotEmpty
    var url: String = ""

    /**
     * arm url
     */
    var armUrl: String? = null
}
