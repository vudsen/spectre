package io.github.vudsen.spectre.core.controller.ws

import tools.jackson.databind.node.ArrayNode

data class PullResultsWebSocketRequest(
    val type: String,
)

data class PullResultWebSocketEvent(
    val type: String = "pull_result",
    val instanceId: String,
    val messages: ArrayNode,
)
