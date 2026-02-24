package io.github.vudsen.spectre.core.plugin.test

import com.fasterxml.jackson.databind.JsonNode
import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.entity.ArthasSession
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import com.fasterxml.jackson.databind.node.NullNode
import java.util.UUID

class FakeArthasHttpClient : ArthasHttpClient {

    companion object {
        private const val SESSION_ID = "1"
    }


    override fun exec(command: String): JsonNode {
        TODO("Not yet implemented")
    }

    override fun execAsync(sessionId: String, command: String): Int {
        return 1
    }

    override fun execProfilerCommand(
        filename: String,
        commands: MutableList<String>,
        sessionId: String?
    ): JsonNode? {
        TODO("Not yet implemented")
    }

    override fun listProfilerFiles(): List<String> {
        TODO("Not yet implemented")
    }

    override fun deleteProfilerFile(filename: String) {
        TODO("Not yet implemented")
    }

    override fun readProfilerFile(filename: String): BoundedInputStreamSource? {
        TODO("Not yet implemented")
    }

    override fun interruptJob(sessionId: String) {
    }

    override fun pullResults(sessionId: String, consumerId: String): JsonNode {
        // TODO
        return NullNode.instance
    }

    override fun initSession(): ArthasSession {
        return ArthasSession(SESSION_ID, UUID.randomUUID().toString())
    }

    override fun joinSession(sessionId: String): ArthasSession {
        return ArthasSession(sessionId, UUID.randomUUID().toString())
    }

    override fun closeSession(sessionId: String) {
    }

    override fun test() {
    }

    override fun getPort(): Int {
        return 4567
    }

    override fun retransform(source: BoundedInputStreamSource): JsonNode {
        throw BusinessException("This action is not supported by test runtime node.")
    }

}