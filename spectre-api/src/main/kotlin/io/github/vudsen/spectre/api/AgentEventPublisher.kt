package io.github.vudsen.spectre.api

interface AgentEventPublisher {
    /**
     * 当收到普通 token 时
     */
    fun onMessage(content: String)

    fun onToolCallStart(
        toolName: String,
        arguments: String?,
    )

    fun onToolCallEnd(
        toolName: String,
        result: String,
    )

    fun onError(
        e: Exception?,
        msg: String,
    )

    fun askHuman(question: String)

    /**
     * 发送待确认消息。在调用前必须调用 [onToolCallStart] 方法
     */
    fun sendPendingConfirm(toolName: String, arguments: String?)

    fun done()
}
