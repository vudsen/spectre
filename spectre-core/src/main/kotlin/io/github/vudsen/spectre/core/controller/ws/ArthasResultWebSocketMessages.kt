package io.github.vudsen.spectre.core.controller.ws

import tools.jackson.databind.node.ArrayNode

data class PullResultsWebSocketRequest(
    val type: String,
    val requestId: String,
    val instanceIds: List<String>? = null,
)

data class PullResultWebSocketEvent(
    val type: String = "pull_result",
    val requestId: String,
    val instanceId: String,
    val messages: ArrayNode,
)

data class PullErrorWebSocketEvent(
    val type: String = "pull_error",
    val requestId: String,
    val instanceId: String,
    val message: String,
)

data class PullCompleteWebSocketEvent(
    val type: String = "pull_complete",
    val requestId: String,
    val instanceId: String,
    val deliveredCount: Int,
)
