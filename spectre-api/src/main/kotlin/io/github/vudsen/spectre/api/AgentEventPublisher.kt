package io.github.vudsen.spectre.api

import io.github.vudsen.spectre.api.dto.AiToolCallDTO

interface AgentEventPublisher {
    /**
     * 当收到普通 token 时
     */
    fun onMessage(content: String)

    fun onToolCallsStart(toolCalls: List<AiToolCallDTO>)

    fun onToolCallEnd(
        toolCallId: String,
        toolName: String,
        result: String,
    )

    fun onError(
        e: Exception?,
        msg: String,
    )

    fun done()
}
