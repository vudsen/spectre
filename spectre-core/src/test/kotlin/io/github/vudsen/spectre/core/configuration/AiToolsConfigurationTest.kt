package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.entity.AskHumanRequest
import io.github.vudsen.spectre.api.entity.ExecuteArthasCommandRequest
import io.github.vudsen.spectre.api.entity.ProfilerFile
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.core.configuration.constant.CacheConstant
import io.github.vudsen.spectre.core.service.ai.AiConversationStateStore
import io.github.vudsen.spectre.core.service.ai.AiToolCallContextHolder
import io.github.vudsen.spectre.core.service.ai.AskHumanInterruptedException
import io.github.vudsen.spectre.core.service.ai.PendingConfirmInterruptedException
import io.github.vudsen.spectre.core.service.ai.PendingConfirmToolService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.cache.concurrent.ConcurrentMapCacheManager
import tools.jackson.databind.JsonNode
import tools.jackson.databind.node.JsonNodeFactory

class AiToolsConfigurationTest {

    @Test
    fun executeArthasCommand_whenConfirmRequired_shouldEmitPendingConfirmAndStoreState() {
        val store = AiConversationStateStore(ConcurrentMapCacheManager(CacheConstant.DEFAULT_CACHE_KEY))
        val holder = AiToolCallContextHolder()
        val arthasExecutionService = FakeArthasExecutionService()
        val configuration = AiToolsConfiguration(
            arthasExecutionService,
            store,
            holder,
            PendingConfirmToolService(arthasExecutionService)
        )

        holder.open("conv-1", "channel-1", null)

        val request = ExecuteArthasCommandRequest().apply {
            command = "thread -n 1"
        }

        assertThrows<PendingConfirmInterruptedException> {
            configuration.executeArthasCommand().invoke(request)
        }

        val messages = holder.snapshotMessages()
        assertEquals(2, messages.size)
        assertEquals(AiMessageDTO.MessageType.TOOL_CALL_START, messages[0].type)
        assertEquals(AiMessageDTO.MessageType.PENDING_CONFIRM, messages[1].type)
        assertEquals("executeArthasCommand", messages[1].data)
        assertEquals("thread -n 1", messages[1].parameter)

        val pending = store.takePendingToolConfirm("conv-1")
        assertNotNull(pending)
        assertEquals("executeArthasCommand", pending!!.toolName)
        assertEquals("thread -n 1", pending.parameter)
        assertEquals("channel-1", pending.channelId)
        assertTrue(pending.toolCallId.isNotBlank())
        assertEquals(0, arthasExecutionService.execSyncCallCount)
    }

    @Test
    fun askHuman_shouldKeepOriginalInterruptFlow() {
        val store = AiConversationStateStore(ConcurrentMapCacheManager(CacheConstant.DEFAULT_CACHE_KEY))
        val holder = AiToolCallContextHolder()
        val fakeArthas = FakeArthasExecutionService()
        val configuration = AiToolsConfiguration(
            fakeArthas,
            store,
            holder,
            PendingConfirmToolService(fakeArthas)
        )

        holder.open("conv-2", "channel-2", null)

        val request = AskHumanRequest().apply {
            question = "confirm?"
            options = listOf("YES", "SKIP")
        }

        assertThrows<AskHumanInterruptedException> {
            configuration.askHuman().invoke(request)
        }

        val messages = holder.snapshotMessages()
        assertEquals(2, messages.size)
        assertEquals(AiMessageDTO.MessageType.TOOL_CALL_START, messages[0].type)
        assertEquals(AiMessageDTO.MessageType.ASK_HUMAN, messages[1].type)
        assertTrue(store.hasPendingAskHuman("conv-2"))
    }

    private class FakeArthasExecutionService : ArthasExecutionService {
        var execSyncCallCount: Int = 0

        override fun requireAttach(runtimeNodeId: Long, treeNodeId: String, bundleId: Long): AttachStatus {
            throw UnsupportedOperationException("not used in test")
        }

        override fun joinChannel(channelId: String, ownerIdentifier: String): ArthasConsumerDTO {
            throw UnsupportedOperationException("not used in test")
        }

        override fun execAsync(channelId: String, command: String) {
            throw UnsupportedOperationException("not used in test")
        }

        override fun execSync(channelId: String, command: String): JsonNode {
            execSyncCallCount += 1
            return JsonNodeFactory.instance.objectNode()
        }

        override fun pullResults(channelId: String, consumerId: String): JsonNode {
            throw UnsupportedOperationException("not used in test")
        }

        override fun interruptCommand(channelId: String) {
            throw UnsupportedOperationException("not used in test")
        }

        override fun retransform(channelId: String, source: BoundedInputStreamSource): JsonNode {
            throw UnsupportedOperationException("not used in test")
        }

        override fun listProfilerFiles(channelId: String): List<ProfilerFile> {
            throw UnsupportedOperationException("not used in test")
        }

        override fun readProfilerFile(file: ProfilerFile): BoundedInputStreamSource? {
            throw UnsupportedOperationException("not used in test")
        }
    }
}
