package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeExtensionTest.Companion.MATH_GAME
import io.github.vudsen.spectre.test.AbstractSpectreIntegrationTest
import io.github.vudsen.spectre.test.GlobalDisposer
import io.github.vudsen.spectre.test.TestConstant
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.springframework.test.web.reactive.server.expectBody
import org.springframework.test.web.reactive.server.expectBodyList
import org.testcontainers.containers.GenericContainer
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
import org.testcontainers.utility.DockerImageName

class SshDockerRuntimeNodeIntegrationTest : AbstractSpectreIntegrationTest() {


    @Test
    fun testDockerAttach() {
        setupCookies(TestConstant.ADMIN_USER_USERNAME, TestConstant.ADMIN_USER_PASSWORD)

        val runtimeNodeId = setupSshDockerRuntimeNode()
        val treeNode = findJvmTreeNode(runtimeNodeId)
        val channelId = prepareChannel(runtimeNodeId, treeNode)

        testChannel(channelId)
    }


    private fun setupSshDockerRuntimeNode(): String {
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

        return client.post().uri("spectre-api/runtime-node/create")
            .cookies(cookiesConsumer)
            .bodyValue(
                mutableMapOf(
                    "name" to "test",
                    "pluginId" to SshRuntimeNodeExtension.ID,
                    "configuration" to objectMapper.writeValueAsString(
                        SshRuntimeNodeConfig(
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
                    ),
                    "restrictedMode" to true
                )
            )
            .exchange()
            .expectStatus()
            .isOk
            .expectBody<String>()
            .returnResult()
            .responseBody!!
    }

    override fun findJvmTreeNode(runtimeNodeId: String): JvmTreeNodeDTO {
        val treeNode = client.post().uri("spectre-api/runtime-node/expand-tree")
            .cookies(cookiesConsumer)
            .bodyValue(
                mutableMapOf(
                    "runtimeNodeId" to runtimeNodeId
                )
            )
            .exchange()
            .expectBodyList<JvmTreeNodeDTO>()
            .hasSize(1)
            .returnResult()
            .responseBody!!


        val holder = client.post().uri("spectre-api/runtime-node/expand-tree")
            .cookies(cookiesConsumer)
            .bodyValue(
                mutableMapOf(
                    "runtimeNodeId" to runtimeNodeId,
                    "parentNodeId" to treeNode[0].id
                )
            )
            .exchange()
            .expectBodyList<JvmTreeNodeDTO>()
            .returnResult()
            .responseBody!!
        return holder.find { node -> node.name.contains(TestConstant.DOCKER_IMAGE_MATH_GAME) }!!
    }


}