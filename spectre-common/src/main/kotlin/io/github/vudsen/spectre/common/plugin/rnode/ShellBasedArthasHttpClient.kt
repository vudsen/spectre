package io.github.vudsen.spectre.common.plugin.rnode

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.entity.ArthasSession
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.Base64

open class ShellBasedArthasHttpClient(
    protected val runtimeNode: ShellAvailableRuntimeNode,
    protected val clientPath: String,
    protected val arthasHttpEndpoint: String,
    protected val javaPath: String
) : ArthasHttpClient {

    private val objectMapper = ObjectMapper()

    protected open fun sendRequest(body: Any, noCheckResponse: Boolean): JsonNode {
        val encodedBody = Base64.getEncoder().encodeToString(objectMapper.writeValueAsString(body).toByteArray(
            StandardCharsets.UTF_8))
        val result = runtimeNode.execute("$javaPath -jar $clientPath $arthasHttpEndpoint $encodedBody")
        if (result.exitCode != 0) {
            throw BusinessException("命令执行失败, Arthas 接口请求错误，响应信息: " + result.stdout)
        }
        val response = result.stdout

        val node = objectMapper.readTree(response)
        val state = node.get("state").asText()
        if (state == "FAILED" || state == "REFUSED") {
            if (noCheckResponse) {
                return node
            }
            val msgNode = node.get("message") ?: throw BusinessException(response)
            val msg = msgNode.asText()
            if (msg.startsWith("consumer not found")) {
                throw ConsumerNotFountException(msg)
            }
            throw BusinessException(msg)
        }
        return node
    }

    override fun exec(command: String): Any {
        val response = sendRequest(buildMap {
            put("action", "exec")
            put("command", command)
        }, false)
        return response.get("body").get("results")
    }

    override fun asyncExec(sessionId: String, command: String): Int {
        val response = sendRequest(buildMap {
            put("action", "async_exec")
            put("command", command)
            put("sessionId", sessionId)
        }, false)
        return response.get("body").get("jobId").asInt()
    }

    override fun interruptJob(sessionId: String) {
        sendRequest(buildMap {
            put("action", "interrupt_job")
            put("sessionId", sessionId)
        }, false)
    }

    override fun pullResults(
        sessionId: String,
        consumerId: String
    ): JsonNode {
        val response = sendRequest(buildMap {
            put("action", "pull_results")
            put("sessionId", sessionId)
            put("consumerId", consumerId)
        }, false)
        return response.get("body").get("results")
    }

    override fun initSession(): ArthasSession {
        val response = sendRequest(buildMap {
            put("action", "init_session")
        }, false)
        return ArthasSession(response.get("sessionId").asText(), response.get("consumerId").asText())
    }

    override fun joinSession(sessionId: String): ArthasSession {
        val response = sendRequest(buildMap {
            put("action", "join_session")
            put("sessionId", sessionId)
        }, false)
        return ArthasSession(response.get("sessionId").asText(), response.get("consumerId").asText())
    }

    override fun closeSession(sessionId: String) {
        sendRequest(buildMap {
            put("action", "close_session")
            put("sessionId", sessionId)
        }, false)
    }

    override fun test() {
        val response = sendRequest("", true)
        val msg = response.get("message")
        if (msg == null) {
            throw AppException("Message is empty!")
        }
        if (msg.asText() != "Process request error: Cannot invoke \"com.taobao.arthas.core.shell.term.impl.http.api.ApiRequest.getRequestId()\" because \"apiRequest\" is null") {
            throw AppException("Port ${getPort()} is in use.")
        }
    }

    override fun getPort(): Int {
        return URL(arthasHttpEndpoint).port
    }

}