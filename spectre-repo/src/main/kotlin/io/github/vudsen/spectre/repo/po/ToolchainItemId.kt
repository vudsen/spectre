package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.entity.ToolchainType
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.validation.constraints.NotEmpty
import org.jetbrains.annotations.NotNull

data class ToolchainItemId(
    @field:NotNull
    @Enumerated(EnumType.STRING)
    var type: ToolchainType? = null,
    @field:NotEmpty
    var tag: String? = null,
)