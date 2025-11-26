package io.github.vudsen.spectre.core.plugin.k8s

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.core.util.TrustAllX509TrustManager
import io.github.vudsen.spectre.core.util.TrustAnyHostnameVerifier
import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import org.slf4j.LoggerFactory
import java.io.PipedInputStream
import java.io.PipedOutputStream
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.security.SecureRandom
import java.util.concurrent.CompletableFuture
import javax.net.ssl.SSLContext

class K8sExecClient(
    endpoint: String,
    commands: List<String>,
    namespace: String,
    podName: String,
    containerName: String,
    stdin: Boolean,
    token: String
) {

    companion object {
        private val insecureHttpClient: OkHttpClient by lazy {
            val sslContext: SSLContext = SSLContext.getInstance("TLSv1.2")
            sslContext.init(null, arrayOf(TrustAllX509TrustManager), SecureRandom())

            OkHttpClient()
                .newBuilder()
                .sslSocketFactory(sslContext.socketFactory, TrustAllX509TrustManager)
                .hostnameVerifier(TrustAnyHostnameVerifier)
                .build()
        }

        private val logger = LoggerFactory.getLogger(K8sExecClient::class.java)

        private val secureHttpClient = OkHttpClient()

        private val objectMapper = ObjectMapper()
    }

    /**
     * 是否忽略 SSL
     */
    var insecure: Boolean = false

    private val future = CompletableFuture<CommandExecuteResult>()

    private val request: Request = Request.Builder().url(buildString {
        append(endpoint)
        append("/api/v1/namespaces/")
        append(namespace)
        append("/pods/")
        append(podName)
        append("/exec?stdin=")
        append(stdin)
        append("&container=")
        append(containerName)
        append("&stdout=true&stderr=true&tty=false")
        for (command in commands) {
            append("&command=")
            append(URLEncoder.encode(command, StandardCharsets.UTF_8))
        }
    }).header("Sec-WebSocket-Protocol", "v5.channel.k8s.io,v4.channel.k8s.io")
        .header("Connection", "Upgrade")
        .header("Upgrade", "SPDY/3.1")
        .header("Authorization", "Bearer $token")
        .method("GET", null)
        .build()

    private fun getHttpCLinet(): OkHttpClient = if (insecure) { insecureHttpClient } else { secureHttpClient }

    val inputStream = PipedInputStream()

    private val pipedOutputStream = PipedOutputStream(inputStream)

    private fun createWs(): WebSocket {
        // See: https://github.com/kubernetes-client/java/blob/master/util/src/main/java/io/kubernetes/client/util/WebSocketStreamHandler.java
        return getHttpCLinet().newWebSocket(request, object : WebSocketListener() {

            override fun onOpen(webSocket: WebSocket, response: Response) {
                response.close()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                complete(castCode(code))
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                super.onMessage(webSocket, text)
            }

            private fun complete(exitCode: Int) {
                pipedOutputStream.close()
                if (!future.isDone) {
                    future.complete(CommandExecuteResult(String(inputStream.readAllBytes()), exitCode))
                }
            }

            private fun castCode(code: Int): Int {
                return if (code == 1000) {
                    0
                } else {
                    code
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                complete(castCode(code))
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                future.completeExceptionally(t)
                response?.close()
            }

            override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                val stream = bytes.get(0)
                val arr = bytes.toByteArray()
                if (stream == 255.toByte()) {
                    pipedOutputStream.write(arr, 1, arr.size - 1)
                    TODO("Tip exec failed.")
                } else if (stream == 1.toByte() || stream == 2.toByte()) {
                    pipedOutputStream.write(arr, 1, arr.size - 1)
                    return
                } else if (stream == 3.toByte()){
                    val tree = objectMapper.readTree(arr, 1, arr.size - 1)
                    val status = tree.get("status")
                    if (status == null || !status.isTextual || "Success" != status.asText()) {
                        complete(1)
                        if (logger.isDebugEnabled) {
                            logger.debug("Failed to execute command, api response:\n{}", tree.toPrettyString())
                        }
                    } else {
                        complete(0)
                    }
                    return
                }
                throw AppException("Broken pipe.")
            }

        })
    }

    fun waitClose() {
        future.get()
    }

    /**
     * 执行命令，并阻塞当前线程直到执行完毕
     */
    fun exec(): CommandExecuteResult {
        createWs()
        return future.get()
    }

    fun isAlive(): Boolean {
        return !future.isDone
    }

    /**
     * 当 stdin 开启时，使用该命令开启交互式执行
     */
    fun execWithStdinOpen(): WebSocket {
        return createWs()
    }

}