package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.repo.entity.ToolchainType
import java.sql.Timestamp

data class ToolchainItemModifyDTO(
    var type: ToolchainType? = null,
    var version: String? = null,
    var url: String? = null,
    val createdAt: Timestamp? = null,
)