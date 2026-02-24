package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.ArthasInstanceService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.common.plugin.rnode.ShellBasedArthasHttpClient
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import io.github.vudsen.spectre.test.AbstractSpectreTest
import io.github.vudsen.spectre.test.GlobalDisposer
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.plugin.AttachTester
import org.junit.jupiter.api.Assertions
import org.springframework.beans.factory.annotation.Autowired
import org.testcontainers.containers.GenericContainer
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
import org.testcontainers.utility.DockerImageName
import kotlin.test.Test

class SshRuntimeNodeExtensionTest : AbstractSpectreTest() {

    @set:Autowired
    lateinit var runtimeNodeService: RuntimeNodeService

    @set:Autowired
    lateinit var attachTester: AttachTester

    @set:Autowired
    lateinit var arthasInstanceService: ArthasInstanceService


    companion object {
        const val MATH_GAME = "math-game"
    }


    @Test
    fun testDockerAttach() {
        val runtimeNodeId = setupDockerAttachContainer()

        val root = runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, null)
        val dockerNode = root.get(0)

        val dockerNodes = runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, dockerNode.id)

        val mathGame = dockerNodes.find { node -> node.name.startsWith(MATH_GAME) }
        Assertions.assertNotNull(mathGame)

        attachTester.testAttach(runtimeNodeId, mathGame!!)
    }

    private fun setupDockerAttachContainer(): Long {
        val container = GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSHD_WITH_DOCKER)).apply {
            withExposedPorts(22)
            withFileSystemBind("/var/run/docker.sock", "/var/run/docker.sock")
        }
        container.start()

        val result =
            container.execInContainer("/usr/bin/docker", "run", "--name", MATH_GAME, "--rm", "-d", TestConstant.DOCKER_IMAGE_MATH_GAME)
        if (result.exitCode != 0) {
            Assertions.fail<Unit>("Failed to start docker run command: $result")
        }
        GlobalDisposer.registerDispose {
            container.execInContainer("/usr/bin/docker", "stop", MATH_GAME)
            container.close()
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
        val runtimeNodeId = runtimeNodeService.createRuntimeNode(
            RuntimeNodePO(
                name = "Test Node",
                pluginId = SshRuntimeNodeExtension.ID,
                configuration = objectMapper.writeValueAsString(conf)
            )
        ).id
        return runtimeNodeId
    }


    @Test
    fun testLocalAttach() {
        val pair = setupContainerForLocal()
        val runtimeNodeId = pair.second

        try {
            val root = runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, null)
            val localeNode = root.get(0)

            val localJvms =
                runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, localeNode.id)

            val mathGame = localJvms.get(0)
            Assertions.assertTrue(mathGame.isJvm)

            attachTester.testAttach(runtimeNodeId, mathGame)
        } finally {
            pair.first.close()
        }
    }

    @Test
    fun testExecWithWrongPassword() {
        val pair = setupContainerForLocal()
        val runtimeNodeId = pair.second

        try {
            val root = runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, null)
            val localeNode = root.get(0)

            val localJvms =
                runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, localeNode.id)

            val mathGame = localJvms.get(0)
            Assertions.assertTrue(mathGame.isJvm)

            val channelId = attachTester.attachSync(runtimeNodeId, mathGame)
            val clientPair = arthasInstanceService.resolveCachedClientByChannelId(channelId)!!
            val client = clientPair.first!! as ShellBasedArthasHttpClient
            client.password = "invalid"
            try {
                client.exec("version")
            } catch (e: BusinessException) {
                Assertions.assertNotNull(e.message)
                Assertions.assertTrue(e.message!!.contains("Server returned HTTP response code: 401 for URL"))
            }
        } finally {
            pair.first.close()
        }
    }

    private fun setupContainerForLocal(): Pair<GenericContainer<*>, Long> {
        val container = GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSH_WITH_MATH_GAME)).apply {
            withExposedPorts(22)
        }
        container.start();
        GlobalDisposer.registerDispose {
            container.close()
        }

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
        val runtimeNodeId = runtimeNodeService.createRuntimeNode(
            RuntimeNodePO(
                name = "Test Node",
                pluginId = SshRuntimeNodeExtension.ID,
                configuration = objectMapper.writeValueAsString(conf)
            )
        ).id
        return Pair(container,runtimeNodeId)
    }


}