package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class CreateChannelRequestVO {
    var bundleId: Long = -1
    @field:NotEmpty
    var treeNodeId: String = ""
    var runtimeNodeId: Long = -1
}