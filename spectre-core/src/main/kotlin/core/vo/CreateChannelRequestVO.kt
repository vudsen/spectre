package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotNull

class CreateChannelRequestVO {
    var bundleId: Long = -1
    @NotNull
    lateinit var treeNodeId: String
    var runtimeNodeId: Long = -1
}