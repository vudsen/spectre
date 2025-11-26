package io.github.vudsen.spectre.api.dto

import com.fasterxml.jackson.annotation.JsonProperty

class JvmTreeNodeDTO(
    /**
     * 后端随机id，并非 jvm id.
     */
    var id: String,
    var name: String,
    @field:JsonProperty("isJvm")
    var isJvm: Boolean,
)