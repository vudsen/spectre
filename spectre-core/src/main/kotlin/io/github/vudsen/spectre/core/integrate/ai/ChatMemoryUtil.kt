package io.github.vudsen.spectre.core.integrate.ai

import org.springframework.ai.chat.memory.ChatMemory
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.messages.ToolResponseMessage

/**
 * 获取当前还没有完整响应的工具批次
 */
fun ChatMemory.currentPendingToolBatch(conversationId: String): AssistantMessage? {
    val messages = get(conversationId)
    if (messages.isEmpty()) {
        return null
    }
    var assistantMessage: AssistantMessage? = null
    for (i in messages.size - 1 downTo 0) {
        val current = messages[i]
        if (current is AssistantMessage) {
            assistantMessage = current
            break
        } else if (current is ToolResponseMessage) {
            continue
        } else {
            break
        }
    }
    if (assistantMessage == null) {
        return null
    }
    if (assistantMessage.toolCalls.isEmpty()) {
        return null
    }
    val trailingToolResponseCount = messages.asReversed().takeWhile { it is ToolResponseMessage }.size
    if (assistantMessage.toolCalls.size == trailingToolResponseCount) {
        return null
    }
    return assistantMessage
}
