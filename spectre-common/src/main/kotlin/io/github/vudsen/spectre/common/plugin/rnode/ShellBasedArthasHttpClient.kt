package io.github.vudsen.spectre.common.plugin.rnode

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.entity.ArthasSession
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException
import io.github.vudsen.spectre.api.exception.SessionNotFoundException
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.common.util.SecureUtils
import org.slf4j.LoggerFactory
import org.springframework.core.io.InputStreamSource
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.Base64

open class ShellBasedArthasHttpClient(
    protected val runtimeNode: ShellAvailableRuntimeNode,
    protected val clientPath: String,
    protected val arthasHttpEndpoint: String,
    protected val javaPath: String,
    /**
     * 该字段暴露仅用于测试
     */
    var password: String
) : ArthasHttpClient {

    companion object {
        @JvmStatic
        private val logger = LoggerFactory.getLogger(ShellBasedArthasHttpClient::class.java)
        private val supportedFormats = setOf("html", "flat", "traces", "collapsed", "flamegraph", "tee", "jfr")
    }

    private val objectMapper = ObjectMapper()

    protected open fun sendRequest(body: Any, noCheckResponse: Boolean): JsonNode {
        val encodedBody = Base64.getEncoder().encodeToString(objectMapper.writeValueAsString(body).toByteArray(
            StandardCharsets.UTF_8))
        val result = runtimeNode.execute("$javaPath -jar $clientPath $arthasHttpEndpoint $encodedBody $password")
        if (result.exitCode != 0) {
            if (logger.isDebugEnabled) {
                logger.debug("Running command '{}' failed, exit code: {}", "$javaPath -jar $clientPath $arthasHttpEndpoint $encodedBody $password", result.exitCode)
            }
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
            } else if (msg.startsWith("session not found")) {
                throw SessionNotFoundException()
            }
            throw BusinessException(msg)
        }
        return node
    }

    override fun exec(command: String): JsonNode {
        val response = sendRequest(buildMap {
            put("action", "exec")
            put("command", command)
        }, false)
        return response.get("body").get("results")
    }

    override fun execAsync(sessionId: String, command: String): Int {
        val response = sendRequest(buildMap {
            put("action", "async_exec")
            put("command", command)
            put("sessionId", sessionId)
        }, false)
        return response.get("body").get("jobId").asInt()
    }

    private fun findArgValue(commands: List<String>, key: String): Pair<String, Int>? {
        val i = commands.indexOf(key)
        if (i < 0) {
            return null
        }
        if (i + 1 >= commands.size) {
            return null
        }
        return Pair(commands[i + 1], i + 1)
    }


    override fun execProfilerCommand(
        filename: String,
        commands: MutableList<String>,
        sessionId: String?
    ): JsonNode? {
        val pair = findArgValue(commands, "--file") ?: findArgValue(commands, "-f")
        if (pair == null) {
            val formatPair = findArgValue(commands, "--format") ?: findArgValue(commands, "-o")
            commands.add("--file")
            if (formatPair == null) {
                commands.add("${runtimeNode.getHomePath()}/profiler/${filename}.html")
            } else {
                if (!supportedFormats.contains(formatPair.first)) {
                    throw BusinessException("不支持的输出类型: ${formatPair.first}")
                }
                commands.add("${runtimeNode.getHomePath()}/profiler/${filename}.${formatPair.first}")
            }
        } else {
            val pos = pair.first.lastIndexOf('.')
            val ext = pair.first.substring(pos + 1, pair.first.length)

            if (SecureUtils.isNotPureFilename(ext)) {
                throw BusinessException("Invalid file extension: $ext")
            }
            commands[pair.second] = "${getProfilerDirectory()}/${filename}.${ext}"
        }
        if (sessionId == null) {
            return exec(commands.joinToString(" "))
        } else {
            execAsync(sessionId, commands.joinToString(" "))
            return null
        }
    }

    private fun getProfilerDirectory(): String {
        val directory = "${runtimeNode.getHomePath()}/profiler"
        if (!runtimeNode.isDirectoryExist(directory)) {
            runtimeNode.mkdirs(directory)
        }
        return directory
    }

    override fun listProfilerFiles(): List<String> {
        return runtimeNode.listFiles(getProfilerDirectory())
    }

    override fun deleteProfilerFile(filename: String) {
        return runtimeNode.deleteFile("${getProfilerDirectory()}/${filename}")
    }

    override fun readProfilerFile(filename: String): BoundedInputStreamSource? {
        return runtimeNode.readFile("${getProfilerDirectory()}/${filename}")
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
        val response = exec("version")
        if (!response.isArray) {
            throw BusinessException("Not an array")
        }
        for (node in response) {
            val ver = node.get("version")
            if (ver.isTextual) {
                return
            }
        }
        throw BusinessException("Attach failed.")
    }

    override fun getPort(): Int {
        return URL(arthasHttpEndpoint).port
    }

    override fun retransform(source: BoundedInputStreamSource): JsonNode {
        val dest = "${runtimeNode.getHomePath()}/downloads/rt${System.currentTimeMillis()}.class"
        try {
            runtimeNode.upload(source, dest)
            return exec("retransform $dest")
        } finally {
            if (runtimeNode.execute("rm $dest").isFailed()) {
                logger.warn("Failed to remove file $dest on runtime node ${runtimeNode}")
            }
        }
    }

}
