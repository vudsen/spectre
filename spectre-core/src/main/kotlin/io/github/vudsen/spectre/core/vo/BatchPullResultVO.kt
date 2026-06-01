package io.github.vudsen.spectre.core.vo

import tools.jackson.databind.node.ArrayNode

class BatchPullResultVO(
    var isError: Boolean?,
    /**
     * 错误信息
     */
    var message: String?,
    var data: ArrayNode?,
) {
    constructor() : this(false, null, null)
}
