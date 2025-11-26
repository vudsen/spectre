package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.entity.ToolchainType
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated

data class ToolchainItemId(
    @Enumerated(EnumType.STRING)
    var type: ToolchainType? = null,
    // TODO: 防止路径注入
    var tag: String? = null,
)