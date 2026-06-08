package io.github.vudsen.spectre.test

import io.github.vudsen.spectre.common.util.GLOBAL_JSON_MAPPER
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.slf4j.LoggerFactory
import tools.jackson.databind.node.ArrayNode
import java.io.Closeable
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class ArthasResultWebSocketClient private constructor(
    private val opened: CountDownLatch,
) : Closeable {
    companion object {
        private val logger = LoggerFactory.getLogger(ArthasResultWebSocketClient::class.java)
        private val okHttpClient = OkHttpClient.Builder().readTimeout(0, TimeUnit.MILLISECONDS).build()

        fun connect(
            baseHttpUrl: String,
            channelId: String,
            cookieHeader: String,
        ): ArthasResultWebSocketClient {
            val openLatch = CountDownLatch(1)
            val client = ArthasResultWebSocketClient(openLatch)
            val requestBuilder =
                Request
                    .Builder()
                    .url("$baseHttpUrl/spectre-api/arthas/channel/results-ws?channelId=$channelId".replaceFirst("http", "ws"))
            if (cookieHeader.isNotBlank()) {
                requestBuilder.header("Cookie", cookieHeader)
            }
            val webSocket =
                okHttpClient.newWebSocket(
                    requestBuilder.build(),
                    object : WebSocketListener() {
                        override fun onOpen(
                            webSocket: WebSocket,
                            response: Response,
                        ) {
                            response.close()
                            openLatch.countDown()
                        }

                        override fun onMessage(
                            webSocket: WebSocket,
                            text: String,
                        ) {
                            client.handleMessage(text)
                        }

                        override fun onClosed(
                            webSocket: WebSocket,
                            code: Int,
                            reason: String,
                        ) {
                            client.recordFailure(IllegalStateException("WebSocket closed: $code $reason"))
                        }

                        override fun onClosing(
                            webSocket: WebSocket,
                            code: Int,
                            reason: String,
                        ) {
                            webSocket.close(code, reason)
                        }

                        override fun onFailure(
                            webSocket: WebSocket,
                            t: Throwable,
                            response: Response?,
                        ) {
                            response?.close()
                            client.recordFailure(t)
                        }
                    },
                )
            client.bind(webSocket)
            return client
        }
    }

    private val closed = AtomicBoolean(false)
    private val queues = ConcurrentHashMap<String, LinkedBlockingQueue<ArrayNode>>()

    @Volatile
    private lateinit var webSocket: WebSocket

    @Volatile
    private var failure: Throwable? = null

    fun pullResultsSync(
        instanceIds: List<String>,
        attempts: Int = 5,
        waitPerAttemptMillis: Long = 1_500,
    ): Map<String, ArrayNode> {
        awaitOpen()
        throwIfFailed()

        val collected = linkedMapOf<String, ArrayNode>()
        collectAvailable(instanceIds, collected)

        if (!webSocket.send("""{"type":"pull_results"}""")) {
            throw IllegalStateException("Failed to send websocket pull request for instances $instanceIds")
        }
        repeat(attempts) {
            if (collected.size == instanceIds.size) {
                return collected
            }
            waitForMessages(instanceIds, collected, waitPerAttemptMillis)
        }
        return collected
    }

    override fun close() {
        if (closed.compareAndSet(false, true)) {
            webSocket.close(1000, "integration test disposed")
            webSocket.cancel()
        }
    }

    private fun bind(webSocket: WebSocket) {
        this.webSocket = webSocket
    }

    private fun awaitOpen() {
        if (!opened.await(5, TimeUnit.SECONDS)) {
            throw IllegalStateException("Timed out while opening Arthas result websocket")
        }
    }

    private fun waitForMessages(
        instanceIds: List<String>,
        collected: MutableMap<String, ArrayNode>,
        waitPerAttemptMillis: Long,
    ) {
        val deadline = System.currentTimeMillis() + waitPerAttemptMillis
        while (System.currentTimeMillis() < deadline) {
            throwIfFailed()
            collectAvailable(instanceIds, collected)
            if (collected.size == instanceIds.size) {
                return
            }
            Thread.sleep(500)
        }
        collectAvailable(instanceIds, collected)
    }

    private fun collectAvailable(
        instanceIds: List<String>,
        collected: MutableMap<String, ArrayNode>,
    ) {
        for (instanceId in instanceIds) {
            if (collected.containsKey(instanceId)) {
                continue
            }
            queues[instanceId]?.poll()?.let { messages ->
                collected[instanceId] = messages
            }
        }
    }

    private fun handleMessage(payload: String) {
        val node = GLOBAL_JSON_MAPPER.readTree(payload)
        if (node.path("type").stringValue() != "pull_result") {
            return
        }
        val instanceId = node.path("instanceId").stringValue().orEmpty()
        if (instanceId.isBlank()) {
            logger.warn("Skip websocket result without instanceId: {}", payload)
            return
        }
        val messages = node.path("messages")
        if (messages !is ArrayNode || messages.isEmpty) {
            return
        }
        queues.computeIfAbsent(instanceId) { LinkedBlockingQueue() }.offer(messages)
    }

    private fun throwIfFailed() {
        val throwable = failure
        if (throwable != null) {
            throw IllegalStateException("Arthas result websocket failed", throwable)
        }
    }

    private fun recordFailure(throwable: Throwable) {
        failure = throwable
        opened.countDown()
    }
}
