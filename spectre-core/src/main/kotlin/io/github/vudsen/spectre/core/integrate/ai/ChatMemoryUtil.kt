package io.github.vudsen.spectre.core.integrate.ai

import org.springframework.ai.chat.memory.ChatMemory
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.messages.ToolResponseMessage

/**
 * 获取当前还没有响应的工具
 */
fun ChatMemory.currentNotRespondedTool(conversationId: String): AssistantMessage.ToolCall? {
    val messages = get(conversationId)
    if (messages.isEmpty()) {
        return null
    }
    var toolResponseCnt = 0
    var assistantMessage: AssistantMessage? = null
    for (i in messages.size - 1 downTo 0) {
        val current = messages[i]
        if (current is AssistantMessage) {
            assistantMessage = current
            break
        } else if (current is ToolResponseMessage) {
            toolResponseCnt++
        } else {
            break
        }
    }
    if (assistantMessage == null) {
        return null
    }
    // TODO 支持多工具调用
    if (assistantMessage.toolCalls.size == toolResponseCnt) {
        return null
    }
    return assistantMessage.toolCalls[toolResponseCnt]
}
