package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.api.AiTools
import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.entity.ProfilerFile
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.core.service.ai.AiToolExecutionContext
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import tools.jackson.databind.JsonNode
import tools.jackson.databind.node.JsonNodeFactory

class AiToolsConfigurationTest {
    @Test
    fun executeArthasCommand_shouldBeConfirmRequiredAndExecutable() {
        val arthasExecutionService = FakeArthasExecutionService()
        val registry = AiToolsConfiguration(arthasExecutionService).aiToolRegistry()

        assertTrue(registry.requiresConfirm(AiTools.EXECUTE_ARTHAS_COMMAND))
        assertFalse(registry.requiresConfirm(AiTools.ASK_HUMAN))

        val result =
            registry.execute(
                toolName = AiTools.EXECUTE_ARTHAS_COMMAND,
                context =
                    AiToolExecutionContext(
                        conversationId = "conv-1",
                        channelId = "channel-1",
                        securityContext = null,
                    ),
                argumentsJson = "{\"command\":\"thread -n 1\"}",
            )

        assertEquals(1, arthasExecutionService.execSyncCallCount)
        assertEquals("thread -n 1", result.parameter)
    }

    @Test
    fun askHuman_shouldReturnSuccessResultWithJsonPayload() {
        val registry = AiToolsConfiguration(FakeArthasExecutionService()).aiToolRegistry()

        val result =
            registry.execute(
                toolName = AiTools.ASK_HUMAN,
                context =
                    AiToolExecutionContext(
                        conversationId = "conv-2",
                        channelId = "channel-2",
                        securityContext = null,
                    ),
                argumentsJson = "{\"question\":\"confirm?\",\"options\":[\"YES\",\"NO\"]}",
            )

        assertTrue(result.output.contains("confirm?"))
        assertTrue(result.output.contains("YES"))
        assertTrue(result.output.contains("NO"))
    }

    private class FakeArthasExecutionService : ArthasExecutionService {
        var execSyncCallCount: Int = 0

        override fun requireAttach(
            runtimeNodeId: Long,
            treeNodeId: String,
            bundleId: Long,
        ): AttachStatus = throw UnsupportedOperationException("not used in test")

        override fun joinChannel(
            channelId: String,
            ownerIdentifier: String,
        ): ArthasConsumerDTO = throw UnsupportedOperationException("not used in test")

        override fun execAsync(
            channelId: String,
            command: String,
        ): Unit = throw UnsupportedOperationException("not used in test")

        override fun execSync(
            channelId: String,
            command: String,
        ): JsonNode {
            execSyncCallCount += 1
            return JsonNodeFactory.instance.objectNode()
        }

        override fun pullResults(
            channelId: String,
            consumerId: String,
        ): JsonNode = throw UnsupportedOperationException("not used in test")

        override fun interruptCommand(channelId: String): Unit = throw UnsupportedOperationException("not used in test")

        override fun retransform(
            channelId: String,
            source: BoundedInputStreamSource,
        ): JsonNode = throw UnsupportedOperationException("not used in test")

        override fun listProfilerFiles(channelId: String): List<ProfilerFile> = throw UnsupportedOperationException("not used in test")

        override fun readProfilerFile(file: ProfilerFile): BoundedInputStreamSource? =
            throw UnsupportedOperationException("not used in test")
    }
}
