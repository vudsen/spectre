package io.github.vudsen.spectre.core.service.ai

import io.github.vudsen.spectre.core.configuration.constant.CacheConstant
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.cache.concurrent.ConcurrentMapCacheManager

class AiConversationStateStoreTest {

    private fun newStore(): AiConversationStateStore {
        return AiConversationStateStore(ConcurrentMapCacheManager(CacheConstant.DEFAULT_CACHE_KEY))
    }

    @Test
    fun pendingToolConfirm_shouldSupportSaveGetTakeAndConsume() {
        val store = newStore()
        val conversationId = "conv-1"

        assertFalse(store.hasPendingToolConfirm(conversationId))
        assertNull(store.getPendingToolConfirm(conversationId))

        store.savePendingToolConfirm(
            conversationId = conversationId,
            toolCallId = "call-1",
            toolName = "executeArthasCommand",
            toolArguments = "{\"command\":\"thread -n 1\"}",
            parameter = "thread -n 1",
            channelId = "channel-1",
        )

        assertTrue(store.hasPendingToolConfirm(conversationId))
        val pending = store.getPendingToolConfirm(conversationId)
        assertNotNull(pending)
        assertEquals("call-1", pending!!.toolCallId)
        assertEquals("executeArthasCommand", pending.toolName)
        assertEquals("thread -n 1", pending.parameter)
        assertEquals("channel-1", pending.channelId)

        val consumed = store.takePendingToolConfirm(conversationId)
        assertNotNull(consumed)
        assertEquals("executeArthasCommand", consumed!!.toolName)
        assertFalse(store.hasPendingToolConfirm(conversationId))
        assertNull(store.takePendingToolConfirm(conversationId))
    }

    @Test
    fun pendingAskHuman_shouldSupportSaveGetTakeAndConsume() {
        val store = newStore()
        val conversationId = "conv-2"

        assertFalse(store.hasPendingAskHuman(conversationId))
        assertNull(store.getPendingAskHuman(conversationId))

        store.savePendingAskHuman(
            conversationId = conversationId,
            toolCallId = "call-2",
            toolName = "askHuman",
            requestJson = "{\"question\":\"q\"}",
            parameter = "{\"question\":\"q\"}",
        )

        assertTrue(store.hasPendingAskHuman(conversationId))
        val pending = store.getPendingAskHuman(conversationId)
        assertNotNull(pending)
        assertEquals("call-2", pending!!.toolCallId)
        assertEquals("askHuman", pending.toolName)

        val consumed = store.takePendingAskHuman(conversationId)
        assertNotNull(consumed)
        assertEquals("call-2", consumed!!.toolCallId)
        assertFalse(store.hasPendingAskHuman(conversationId))
        assertNull(store.takePendingAskHuman(conversationId))
    }

    @Test
    fun buildChatCompletionMessages_shouldIncludeToolCallAndToolResponse() {
        val store = newStore()
        val conversationId = "conv-3"

        store.upsertSystemMessage(conversationId, "sys")
        store.appendUserMessage(conversationId, "user")
        store.appendAssistantMessage(
            conversationId = conversationId,
            content = "",
            toolCalls = listOf(
                AiConversationStateStore.AssistantToolCall(
                    id = "call-3",
                    name = "executeArthasCommand",
                    arguments = "{\"command\":\"thread -n 1\"}",
                )
            ),
        )
        store.appendToolResponseMessage(
            conversationId = conversationId,
            toolCallId = "call-3",
            toolName = "executeArthasCommand",
            responseData = "{\"ok\":true}",
        )

        val messages = store.buildChatCompletionMessages(conversationId)
        assertEquals(4, messages.size)
        assertTrue(messages[0].isSystem())
        assertTrue(messages[1].isUser())
        assertTrue(messages[2].isAssistant())
        assertTrue(messages[3].isTool())
    }
}
