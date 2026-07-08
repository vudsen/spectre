package io.github.vudsen.spectre.core.integrate.ai

import org.springframework.ai.chat.memory.ChatMemory
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.messages.Message
import org.springframework.ai.chat.messages.ToolResponseMessage
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class ChatMemoryUtilTest {
    @Test
    fun `returns pending batch when assistant tool calls are unresolved`() {
        val chatMemory = TestChatMemory()
        chatMemory.add(
            "c1",
            listOf(
                assistantMessage("tool-a", "tool-b"),
            ),
        )

        val batch = chatMemory.currentPendingToolBatch("c1")

        assertNotNull(batch)
        assertEquals(2, batch.toolCalls.size)
    }

    @Test
    fun `returns null when all tool calls already have responses`() {
        val chatMemory = TestChatMemory()
        chatMemory.add(
            "c1",
            listOf(
                assistantMessage("tool-a", "tool-b"),
                toolResponseMessage("tool-a"),
                toolResponseMessage("tool-b"),
            ),
        )

        val batch = chatMemory.currentPendingToolBatch("c1")

        assertNull(batch)
    }

    @Test
    fun `returns assistant message when part of the batch has been answered`() {
        val chatMemory = TestChatMemory()
        chatMemory.add(
            "c1",
            listOf(
                assistantMessage("tool-a", "tool-b"),
                toolResponseMessage("tool-a"),
            ),
        )

        val batch = chatMemory.currentPendingToolBatch("c1")

        assertNotNull(batch)
        assertEquals(2, batch.toolCalls.size)
    }

    private fun assistantMessage(vararg ids: String): AssistantMessage =
        AssistantMessage
            .builder()
            .toolCalls(
                ids.map { id ->
                    AssistantMessage.ToolCall(id, "function", id, "{}")
                },
            ).build()

    private fun toolResponseMessage(toolCallId: String): ToolResponseMessage =
        ToolResponseMessage
            .builder()
            .responses(
                listOf(
                    ToolResponseMessage.ToolResponse(toolCallId, toolCallId, "ok"),
                ),
            ).build()

    private class TestChatMemory : ChatMemory {
        private val messages = linkedMapOf<String, MutableList<Message>>()

        override fun add(
            conversationId: String,
            messages: List<Message>,
        ) {
            this.messages.computeIfAbsent(conversationId) { mutableListOf() }.addAll(messages)
        }

        override fun get(conversationId: String): List<Message> = messages[conversationId]?.toList() ?: emptyList()

        override fun clear(conversationId: String) {
            messages.remove(conversationId)
        }
    }
}
