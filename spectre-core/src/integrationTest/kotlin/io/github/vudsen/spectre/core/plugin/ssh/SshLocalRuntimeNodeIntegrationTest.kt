package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.test.AbstractSpectreIntegrationTest
import io.github.vudsen.spectre.test.TestConstant
import org.junit.jupiter.api.Test
import org.springframework.test.web.reactive.server.expectBody
import org.springframework.test.web.reactive.server.expectBodyList
import org.testcontainers.containers.GenericContainer
import org.testcontainers.utility.DockerImageName

class SshLocalRuntimeNodeIntegrationTest : AbstractSpectreIntegrationTest() {

    @Test
    fun testLocalAttach() {
        setupCookies(TestConstant.ADMIN_USER_USERNAME, TestConstant.ADMIN_USER_PASSWORD)
        val runtimeNodeId = setSshRuntimeNode()
        val treeNode = findJvmTreeNode(runtimeNodeId)
        val channelId = prepareChannel(runtimeNodeId, treeNode)

        testChannel(channelId)
    }


    /**
     * @return runtimeNodeId
     */
    private fun setSshRuntimeNode(): String {
        val sshServer = setupSshServer()

        return client.post().uri("spectre-api/runtime-node/create")
            .cookies(cookiesConsumer)
            .bodyValue(
                mutableMapOf(
                    "name" to "test",
                    "pluginId" to SshRuntimeNodeExtension.ID,
                    "configuration" to objectMapper.writeValueAsString(
                        SshRuntimeNodeConfig(
                            null,
                            SshRuntimeNodeConfig.Local(true, "/opt/java"),
                            sshServer.host,
                            sshServer.firstMappedPort,
                            "root",
                            SshRuntimeNodeConfig.LoginPrincipal(
                                SshRuntimeNodeConfig.LoginType.PASSWORD,
                                "root",
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

    private fun setupSshServer(): GenericContainer<*> {
        val container = GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSH_WITH_MATH_GAME)).apply {
            withExposedPorts(22)
        }
        container.start()

        return container
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
            .hasSize(1)
            .returnResult()
            .responseBody!!
        return holder[0]
    }
}