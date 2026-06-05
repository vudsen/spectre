package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.entity.ProfilerFile
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.ChannelService
import io.github.vudsen.spectre.api.vo.ChannelInfoVO
import io.github.vudsen.spectre.common.util.GLOBAL_JSON_MAPPER
import io.github.vudsen.spectre.core.controller.ws.ArthasChannelResultWebSocketHandler
import io.github.vudsen.spectre.core.controller.ws.ArthasPullResultCoordinator
import io.github.vudsen.spectre.core.controller.ws.ArthasResultWebSocketHandshakeInterceptor
import io.github.vudsen.spectre.repo.po.ChannelPO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.core.task.TaskExecutor
import org.springframework.http.HttpHeaders
import org.springframework.mock.web.MockHttpSession
import org.springframework.web.socket.BinaryMessage
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.PingMessage
import org.springframework.web.socket.PongMessage
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketExtension
import org.springframework.web.socket.WebSocketMessage
import org.springframework.web.socket.WebSocketSession
import tools.jackson.databind.JsonNode
import tools.jackson.databind.node.ArrayNode
import tools.jackson.databind.node.JsonNodeFactory
import tools.jackson.databind.node.ObjectNode
import java.net.InetSocketAddress
import java.net.URI
import java.security.Principal
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class ArthasChannelResultWebSocketHandlerTest {
    @Test
    fun `sends completed instance results before slower peers finish`() {
        val service = FakeArthasExecutionService()
        val releaseSlowInstance = CountDownLatch(1)
        service.onPull("slow") {
            releaseSlowInstance.await(5, TimeUnit.SECONDS)
            messageArray("slow")
        }
        service.onPull("fast") {
            messageArray("fast")
        }

        val handler = createHandler(service, channel("slow", "fast"))
        val session = createSession("1", listOf("slow", "fast"))

        handler.afterConnectionEstablished(session)
        handler.handleMessage(
            session,
            TextMessage(
                """{"type":"pull_results","requestId":"req-1","instanceIds":["slow","fast"]}""",
            ),
        )

        waitUntil(timeoutMs = 2_000) {
            session.messages.any {
                it.path("type").asString() == "pull_result" && it.path("instanceId").asString() == "fast"
            }
        }
        assertFalse(
            session.messages.any {
                it.path("type").asString() == "pull_complete" && it.path("instanceId").asString() == "slow"
            },
        )

        releaseSlowInstance.countDown()

        waitUntil(timeoutMs = 2_000) {
            session.messages.any {
                it.path("type").asString() == "pull_complete" && it.path("instanceId").asString() == "slow"
            }
        }
    }

    @Test
    fun `suppresses empty pull_result payloads but still completes the request`() {
        val service = FakeArthasExecutionService()
        service.onPull("empty") {
            emptyArray()
        }
        val handler = createHandler(service, channel("empty"))
        val session = createSession("1", listOf("empty"))

        handler.afterConnectionEstablished(session)
        handler.handleMessage(
            session,
            TextMessage("""{"type":"pull_results","requestId":"req-1","instanceIds":["empty"]}"""),
        )

        waitUntil(timeoutMs = 2_000) {
            session.messages.any {
                it.path("type").asString() == "pull_complete" && it.path("instanceId").asString() == "empty"
            }
        }

        assertFalse(
            session.messages.any {
                it.path("type").asString() == "pull_result" && it.path("instanceId").asString() == "empty"
            },
        )
    }

    @Test
    fun `debounces only busy instances and still pulls idle peers`() {
        val service = FakeArthasExecutionService()
        val releaseAlpha = CountDownLatch(1)
        service.onPull("alpha") {
            releaseAlpha.await(5, TimeUnit.SECONDS)
            messageArray("alpha")
        }
        service.onPull("beta") {
            messageArray("beta")
        }

        val handler = createHandler(service, channel("alpha", "beta"))
        val session = createSession("1", listOf("alpha", "beta"))

        handler.afterConnectionEstablished(session)
        handler.handleMessage(
            session,
            TextMessage("""{"type":"pull_results","requestId":"req-1","instanceIds":["alpha"]}"""),
        )

        waitUntil(timeoutMs = 2_000) { service.pullCount("alpha") == 1 }

        handler.handleMessage(
            session,
            TextMessage("""{"type":"pull_results","requestId":"req-2","instanceIds":["alpha","beta"]}"""),
        )

        waitUntil(timeoutMs = 2_000) { service.pullCount("beta") == 1 }
        assertEquals(1, service.pullCount("alpha"))

        waitUntil(timeoutMs = 2_000) {
            session.messages.any {
                it.path("type").asString() == "pull_complete" && it.path("instanceId").asString() == "beta"
            }
        }

        releaseAlpha.countDown()

        waitUntil(timeoutMs = 2_000) {
            session.messages.any {
                it.path("type").asString() == "pull_complete" && it.path("instanceId").asString() == "alpha"
            }
        }
    }

    private fun createHandler(
        arthasExecutionService: ArthasExecutionService,
        channelService: ChannelService,
    ): ArthasChannelResultWebSocketHandler {
        val executorService = Executors.newCachedThreadPool()
        val executor =
            TaskExecutor { command ->
                executorService.execute(command)
            }
        val coordinator =
            ArthasPullResultCoordinator(
                arthasExecutionService = arthasExecutionService,
                channelService = channelService,
                executor = executor,
            )
        return ArthasChannelResultWebSocketHandler(coordinator, executor)
    }

    private fun createSession(
        channelId: String,
        instanceIds: List<String>,
    ): RecordingWebSocketSession {
        val httpSession = MockHttpSession()
        for (instanceId in instanceIds) {
            httpSession.setAttribute(
                "InstanceIdToConsumerId:$instanceId",
                ArthasConsumerDTO("consumer-$instanceId", instanceId),
            )
        }
        return RecordingWebSocketSession(
            sessionAttributes =
                ConcurrentHashMap<String, Any>().apply {
                    this[ArthasResultWebSocketHandshakeInterceptor.CHANNEL_ID_ATTR] = channelId
                    this[ArthasResultWebSocketHandshakeInterceptor.HTTP_SESSION_ATTR] = httpSession
                },
        )
    }

    private fun channel(vararg instanceIds: String): ChannelService =
        object : ChannelService {
            override fun resolveChannelById(id: Long): List<ChannelInfoVO> = emptyList()

            override fun createChannel(instanceIds: List<String>): Long = 1L

            override fun findById(id: Long): ChannelPO =
                ChannelPO().apply {
                    this.id = id
                    this.instanceIds = instanceIds.toList()
                    this.lastAccess = Instant.now()
                }
        }

    private fun emptyArray(): ArrayNode = ArrayNode(JsonNodeFactory.instance)

    private fun messageArray(instanceId: String): ArrayNode =
        ArrayNode(JsonNodeFactory.instance).apply {
            add(
                ObjectNode(JsonNodeFactory.instance).apply {
                    put("type", "message")
                    put("jobId", 1)
                    put("message", instanceId)
                },
            )
        }

    private fun waitUntil(
        timeoutMs: Long,
        assertion: () -> Boolean,
    ) {
        val start = System.currentTimeMillis()
        while (System.currentTimeMillis() - start < timeoutMs) {
            if (assertion()) {
                return
            }
            Thread.sleep(20)
        }
        assertTrue(assertion())
    }
}

private class FakeArthasExecutionService : ArthasExecutionService {
    private val handlers = ConcurrentHashMap<String, () -> ArrayNode>()
    private val pullCounter = ConcurrentHashMap<String, AtomicInteger>()

    fun onPull(
        instanceId: String,
        handler: () -> ArrayNode,
    ) {
        handlers[instanceId] = handler
    }

    fun pullCount(instanceId: String): Int = pullCounter[instanceId]?.get() ?: 0

    override fun requireAttach(
        runtimeNodeId: Long,
        treeNodeId: String,
        bundleId: Long,
    ): AttachStatus = throw UnsupportedOperationException()

    override fun joinChannel(
        instanceId: String,
        ownerIdentifier: String,
    ): ArthasConsumerDTO = ArthasConsumerDTO("consumer-$instanceId", instanceId)

    override fun execAsync(
        instanceId: String,
        command: String,
    ): Unit = throw UnsupportedOperationException()

    override fun execSync(
        instanceId: String,
        command: String,
    ): JsonNode = throw UnsupportedOperationException()

    override fun pullResults(
        instanceId: String,
        consumerId: String,
    ): ArrayNode {
        pullCounter.computeIfAbsent(instanceId) { AtomicInteger() }.incrementAndGet()
        return handlers[instanceId]?.invoke() ?: emptyArray()
    }

    override fun interruptCommand(instanceId: String): Unit = throw UnsupportedOperationException()

    override fun retransform(
        instanceId: String,
        source: BoundedInputStreamSource,
    ): JsonNode = throw UnsupportedOperationException()

    override fun listProfilerFiles(instanceId: String): List<ProfilerFile> = emptyList()

    override fun readProfilerFile(file: ProfilerFile): BoundedInputStreamSource? = null

    private fun emptyArray(): ArrayNode = ArrayNode(JsonNodeFactory.instance)
}

private class RecordingWebSocketSession(
    private val sessionAttributes: MutableMap<String, Any>,
) : WebSocketSession {
    private var open = true
    val messages = CopyOnWriteArrayList<JsonNode>()

    override fun getId(): String = "ws-session"

    override fun getUri(): URI = URI.create("ws://localhost/arthas/channel/results-ws")

    override fun getHandshakeHeaders(): HttpHeaders = HttpHeaders()

    override fun getAttributes(): MutableMap<String, Any> = sessionAttributes

    override fun getPrincipal(): Principal = Principal { "tester" }

    override fun getLocalAddress(): InetSocketAddress? = null

    override fun getRemoteAddress(): InetSocketAddress? = null

    override fun getAcceptedProtocol(): String? = null

    override fun setTextMessageSizeLimit(messageSizeLimit: Int) {
    }

    override fun getTextMessageSizeLimit(): Int = 0

    override fun setBinaryMessageSizeLimit(messageSizeLimit: Int) {
    }

    override fun getBinaryMessageSizeLimit(): Int = 0

    override fun getExtensions(): MutableList<WebSocketExtension> = mutableListOf()

    override fun sendMessage(message: WebSocketMessage<*>) {
        when (message) {
            is TextMessage -> messages.add(GLOBAL_JSON_MAPPER.readTree(message.payload))
            is BinaryMessage -> {}
            is PingMessage -> {}
            is PongMessage -> {}
        }
    }

    override fun isOpen(): Boolean = open

    override fun close() {
        open = false
    }

    override fun close(status: CloseStatus) {
        open = false
    }
}
