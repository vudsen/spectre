package io.github.vudsen.spectre.core.plugin.ssh

import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.ObjectNode
import com.github.dockerjava.api.DockerClient
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
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
import org.testcontainers.containers.startupcheck.IsRunningStartupCheckStrategy
import org.testcontainers.containers.startupcheck.StartupCheckStrategy
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
import org.testcontainers.utility.DockerImageName
import kotlin.test.Test

class SshRuntimeNodeExtensionTest : AbstractSpectreTest() {

    @set:Autowired
    lateinit var runtimeNodeService: RuntimeNodeService

    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService

    companion object {
        const val MATH_GAME = "math-game"
    }


    @Test
    fun testDockerAttach() {
        val runtimeNodeId = setupDockerAttachContainer()

        val root = runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, null)
        val dockerNode = root.get(0)

        val dockerNodes = runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, dockerNode.id)

        val mathGame = dockerNodes.find { node -> node.name == MATH_GAME }
        Assertions.assertNotNull(mathGame)

        testNodeAttach(runtimeNodeId, mathGame!!)
    }

    private fun setupDockerAttachContainer(): Long {
        val container = GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSHD_WITH_DOCKER)).apply {
            withExposedPorts(5432)
            withFileSystemBind("/var/run/docker.sock", "/var/run/docker.sock")
        }
        container.withStartupCheckStrategy(IsRunningStartupCheckStrategy())
        container.setWaitStrategy(Wait.forListeningPort())
        container.start()

        // TODO 结束后删除容器
        val result =
            container.execInContainer("docker run --name $MATH_GAME --rm -d ${TestConstant.DOCKER_IMAGE_MATH_GAME}")
        if (result.exitCode != 0) {
            Assertions.fail<Unit>("Failed to start docker run command: $result")
        }

        val objectMapper = ObjectMapper()
        val conf = SshRuntimeNodeConfig(
            SshRuntimeNodeConfig.Docker(true, "docker", null, null),
            null,
            container.host,
            container.firstMappedPort,
            "root",
            SshRuntimeNodeConfig.LoginPrincipal(
                SshRuntimeNodeConfig.LoginType.PASSWORD,
                "P@ssw0rd",
                null,
                null
            ),
            "/opt/spectre"
        )
        val runtimeNodeId = runtimeNodeService.saveRuntimeNode(
            RuntimeNodePO(
                name = "Test Node",
                pluginId = SshRuntimeNodeExtension.ID,
                configuration = objectMapper.writeValueAsString(conf)
            )
        ).id!!
        return runtimeNodeId
    }


    @Test
    fun testLocalAttach() {
        val runtimeNodeId = setupContainerForLocal()


        runtimeNodeService.getRuntimeNode(runtimeNodeId)!!

        val root = runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, null)
        val localeNode = root.get(0)

        val localJvms =
            runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, localeNode.id)

        val mathGame = localJvms.get(0)
        Assertions.assertTrue(mathGame.isJvm)


        testNodeAttach(runtimeNodeId, mathGame)
    }

    private fun testNodeAttach(runtimeNodeId: Long, mathGame: JvmTreeNodeDTO) {
        val status = loop(20) {
            val attachStatus = arthasExecutionService.requireAttach(
                runtimeNodeId,
                mathGame.id,
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

    private fun setupContainerForLocal(): Long {
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
        val runtimeNodeId = runtimeNodeService.saveRuntimeNode(
            RuntimeNodePO(
                name = "Test Node",
                pluginId = SshRuntimeNodeExtension.ID,
                configuration = objectMapper.writeValueAsString(conf)
            )
        ).id!!
        return runtimeNodeId
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