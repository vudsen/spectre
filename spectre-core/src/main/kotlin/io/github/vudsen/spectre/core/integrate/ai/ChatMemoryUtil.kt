package io.github.vudsen.spectre.core.integrate.ai

import org.springframework.ai.chat.memory.ChatMemory
import org.springframework.ai.chat.messages.AssistantMessage

/**
 * 获取当前还没有完整响应的工具批次
 */
fun ChatMemory.currentPendingToolBatch(conversationId: String): AssistantMessage? {
    val messages = get(conversationId)
    if (messages.isEmpty()) {
        return null
    }
    val last = messages.last()
    if (last !is AssistantMessage || last.toolCalls.isEmpty()) {
        return null
    }
    return last
}
