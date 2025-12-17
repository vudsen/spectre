package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.api.plugin.rnode.Jvm

class ArthasChannelInfoDTO(
    /**
     * Arthas sessionId
     */
    var sessionId: String,
    var runtimeNodeId: Long,
    var treeNodeId: String,
    var port: Int,
    var restrictedMode: Boolean
) {
    lateinit var jvm: Jvm

    constructor() : this("", 0, "", 0, false)
}