package io.github.vudsen.spectre.api.vo

import com.fasterxml.jackson.annotation.JsonProperty
import io.github.vudsen.spectre.repo.entity.ToolchainType
import java.sql.Timestamp

class ToolchainItemResponseVO(
    var type: ToolchainType,
    var tag: String,
    var url: String,
    var armUrl: String,
    var createdAt: Timestamp,
    @field:JsonProperty("isX86Cached")
    var isX86Cached: Boolean,
    @field:JsonProperty("isArmCached")
    var isArmCached: Boolean
)