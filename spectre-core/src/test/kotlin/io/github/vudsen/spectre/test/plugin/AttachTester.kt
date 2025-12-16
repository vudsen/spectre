package io.github.vudsen.spectre.test.plugin

import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.ObjectNode
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeConfig
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeExtension
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.loop
import org.junit.jupiter.api.Assertions
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import org.testcontainers.containers.GenericContainer
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
import org.testcontainers.utility.DockerImageName

@Component
class AttachTester {

    @set:Autowired
    lateinit var runtimeNodeService: RuntimeNodeService


    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService



    fun testAttach(runtimeNodeId: Long, jvmNode: JvmTreeNodeDTO) {
        val channelId = doAttach(runtimeNodeId, jvmNode)
        val sessionDTO = arthasExecutionService.joinChannel(channelId, "test")
        arthasExecutionService.execAsync(channelId, "sc demo.*")

        checkScResult(pullResultSync(channelId, sessionDTO.consumerId))
    }

    fun pullResultSync(channelId: String, consumerId: String): ArrayNode {
        var r: ArrayNode? = null
        loop(5) {
            val result = arthasExecutionService.pullResults(channelId, consumerId)
            if (result is ArrayNode) {
                if (result.isEmpty) {
                    return@loop null
                }
                r = result
                return@loop true
            } else {
                Assertions.fail("Invalid type: ${result::class.java}")
            }
        }
        return r!!
    }

    private fun doAttach(
        runtimeNodeId: Long,
        jvmNode: JvmTreeNodeDTO
    ): String {
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
        return channelId
    }

    private fun checkScResult(node: ArrayNode) {
        Assertions.assertTrue(node.size() == 10)
        val messageNode = node.get(1) as ObjectNode
        Assertions.assertEquals("Welcome to arthas!", messageNode.get("message").asText())
        val scResult = node.get(6) as ObjectNode
        val classes = scResult.get("classNames") as ArrayNode

        Assertions.assertIterableEquals(listOf("demo.MathGame"), classes.map { node -> node.asText() })
    }

    private val commonRuntimeNodeId: Long by lazy {
        val container = GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSH_WITH_MATH_GAME)).apply {
            withExposedPorts(22)
        }
        container.start();

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
        runtimeNodeService.saveRuntimeNode(
            RuntimeNodePO(
                name = "Test Node",
                pluginId = SshRuntimeNodeExtension.ID,
                configuration = objectMapper.writeValueAsString(conf),
                restrictedMode = true
            )
        ).id!!
    }

    /**
     * 新建一个 arthas channel
     * @return channelId
     */
    fun resolveDefaultChannel(): String {
        val root = runtimeNodeService.expandRuntimeNodeTree(commonRuntimeNodeId, null)
        val localeNode = root[0]

        val localJvms =
            runtimeNodeService.expandRuntimeNodeTree(commonRuntimeNodeId, localeNode.id)

        val mathGame = localJvms[0]
        Assertions.assertTrue(mathGame.isJvm)

        return doAttach(commonRuntimeNodeId, mathGame)
    }

}