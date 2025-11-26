package io.github.vudsen.spectre.core.vo

import io.github.vudsen.spectre.repo.entity.ToolchainType
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull

data class ToolchainItemModifyVO(
    @NotEmpty
    var url: String = "",
    @NotNull
    var type: ToolchainType? = null,
    @NotEmpty
    var tag: String? = "",
    var armUrl: String? = "",
)