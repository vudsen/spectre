package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.repo.entity.ToolchainType
import jakarta.validation.constraints.NotEmpty

class UpdateToolchainItemDTO {
    var type: ToolchainType = ToolchainType.ARTHAS

    @NotEmpty
    var tag: String = ""

    /**
     * x86 url
     */
    var url: String? = null

    /**
     * arm url
     */
    var armUrl: String? = null
}
