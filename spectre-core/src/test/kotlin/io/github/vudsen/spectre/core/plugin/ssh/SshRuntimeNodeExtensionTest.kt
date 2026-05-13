package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.dto.CreateRuntimeNodeDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.ArthasInstanceService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.support.plugin.rnode.ShellBasedArthasHttpClient
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
    fun testExecWithWrongPassword() {
        val pair = setupContainerForLocal()
        val runtimeNodeId = pair.second

        try {
            val root = runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, null)
            val localeNode = root[0]

            val localJvms =
                runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, localeNode.id)

            val mathGame = localJvms[0]
            Assertions.assertTrue(mathGame.isJvm)

            val channelId = attachTester.attachSync(runtimeNodeId, mathGame)
            val clientPair = arthasInstanceService.resolveCachedClientByChannelId(channelId)!!
            val client = clientPair.first!! as ShellBasedArthasHttpClient
            client.password = "invalid"
            try {
                client.exec("version")
            } catch (e: BusinessException) {
                Assertions.assertNotNull(e.message)
                Assertions.assertTrue(e.message!!.contains("401"))
            }
        } finally {
            pair.first.close()
        }
    }

    private fun setupContainerForLocal(): Pair<GenericContainer<*>, Long> {
        val container =
            GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSH_WITH_MATH_GAME)).apply {
                withExposedPorts(22)
            }
        container.start()
        GlobalDisposer.registerDispose {
            container.close()
        }

        val objectMapper = ObjectMapper()
        val conf =
            SshRuntimeNodeConfig(
                null,
                SshRuntimeNodeConfig.Local(true, "/opt/java"),
                container.host,
                container.firstMappedPort,
                "root",
                SshRuntimeNodeConfig.LoginPrincipal(
                    SshRuntimeNodeConfig.LoginType.PASSWORD,
                    "root",
                    null,
                    null,
                ),
                "/opt/spectre",
            )
        val runtimeNodeId =
            runtimeNodeService
                .createRuntimeNode(
                    CreateRuntimeNodeDTO().apply {
                        name = "Test Node"
                        pluginId = SshRuntimeNodeExtension.ID
                        configuration = objectMapper.writeValueAsString(conf)
                    },
                ).id
        return Pair(container, runtimeNodeId)
    }
}
