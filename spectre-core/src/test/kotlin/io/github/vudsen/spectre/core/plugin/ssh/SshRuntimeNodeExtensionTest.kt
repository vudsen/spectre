package io.github.vudsen.spectre.core.plugin.ssh

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.ObjectNode
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import io.github.vudsen.spectre.test.AbstractSpectreTest
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.TestContainerUtils
import io.github.vudsen.spectre.test.loop
import org.junit.jupiter.api.Assertions
import org.springframework.beans.factory.annotation.Autowired
import org.testcontainers.containers.GenericContainer
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
import kotlin.test.Test

class SshRuntimeNodeExtensionTest : AbstractSpectreTest() {

    @set:Autowired
    lateinit var runtimeNodeService: RuntimeNodeService

    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService

    private fun insertSshRuntimeNode(container: GenericContainer<*>): Long {
        val objectMapper = ObjectMapper()
        val conf = SshRuntimeNodeConfig(
            null,
            SshRuntimeNodeConfig.Local(true, "/opt/java"),
            container.host,
            container.firstMappedPort,
            "root",
            SshRuntimeNodeConfig.LoginPrincipal(
                SshRuntimeNodeConfig.LoginType.PASSWORD,
                "root",
                null,
                null
            ),
            "/opt/spectre"
        )

        return runtimeNodeService.saveRuntimeNode(RuntimeNodePO(
            name = "Test Node",
            pluginId = SshRuntimeNodeExtension.ID,
            configuration = objectMapper.writeValueAsString(conf)
        )).id!!
    }

    @Test
    fun ensureAttachEnvironmentReadyLocalAttach() {
        val container = TestContainerUtils.createMathGameSshMachine()
        val id = insertSshRuntimeNode(container)

        runtimeNodeService.getRuntimeNode(id)!!

        val root = runtimeNodeService.expandRuntimeNodeTree(id, null)
        val localeNode = root.get(0)

        val localJvms =
            runtimeNodeService.expandRuntimeNodeTree(id, localeNode.id)

        val mathGame = localJvms.get(0)
        Assertions.assertTrue(mathGame.isJvm)


        val status = loop(20) {
            val attachStatus = arthasExecutionService.requireAttach(
                id,
                mathGame.id,
                TestConstant.TOOLCHAIN_BUNDLE_LATEST_ID
            )
            attachStatus.error ?.let {
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