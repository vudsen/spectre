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
}
