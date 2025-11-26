package io.github.vudsen.spectre.api.dto

class JvmTreeNodeDTO(
    /**
     * 后端随机id，并非 jvm id.
     */
    var id: String,
    var name: String,
    var isJvm: Boolean,
)