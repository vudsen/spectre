package io.github.vudsen.spectre.test.plugin

import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.ObjectNode
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.loop
import org.junit.jupiter.api.Assertions
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

@Component
class AttachTester {

    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService


    fun testAttach(runtimeNodeId: Long, jvmNode: JvmTreeNodeDTO) {
        val status = loop(20) {
            val attachStatus = arthasExecutionService.requireAttach(
                runtimeNodeId,
                jvmNode.id,
                TestConstant.TOOLCHAIN_BUNDLE_LATEST_ID
            )
            attachStatus.error?.let {
                Assertions.fail<Unit>("Failed to attach: ${it.message}")
            }
            if (attachStatus.isReady) {
                return@loop attachStatus
            }
            return@loop null
        }

        Assertions.assertTrue(status.isReady, "Attach timeout!")
        Assertions.assertNotNull(status.channelId, "Attach timeout!")
        val channelId = status.channelId!!
        val sessionDTO = arthasExecutionService.joinChannel(channelId, "test")
        arthasExecutionService.execAsync(channelId, "sc demo.*")

        loop(5) {
            val result = arthasExecutionService.pullResults(channelId, sessionDTO.consumerId)
            if (result is ArrayNode) {
                if (result.isEmpty) {
                    return@loop null
                }
                checkScResult(result)
                return@loop true
            } else {
                Assertions.fail("Invalid type: ${result::class.java}")
            }
        }
    }

    private fun checkScResult(node: ArrayNode) {
        Assertions.assertTrue(node.size() == 10)
        val messageNode = node.get(1) as ObjectNode
        Assertions.assertEquals("Welcome to arthas!", messageNode.get("message").asText())
        val scResult = node.get(6) as ObjectNode
        val classes = scResult.get("classNames") as ArrayNode

        Assertions.assertIterableEquals(listOf("demo.MathGame"), classes.map { node -> node.asText() })
    }

}