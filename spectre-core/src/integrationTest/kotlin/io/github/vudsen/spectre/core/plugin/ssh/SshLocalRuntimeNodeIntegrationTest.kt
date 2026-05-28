package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.test.BaseSpectreIntegrationTest
import io.github.vudsen.spectre.test.TestConstant
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.test.web.reactive.server.expectBody
import org.springframework.test.web.reactive.server.expectBodyList
import org.testcontainers.containers.GenericContainer
import org.testcontainers.utility.DockerImageName

class SshLocalRuntimeNodeIntegrationTest : BaseSpectreIntegrationTest() {
    //    @ValueSource(strings = ["java17"])
    @ParameterizedTest
    @ValueSource(strings = ["java8", "java11", "java17", "java25"])
    fun testLocalAttach(sshServerTag: String) {
        setupCookies(TestConstant.ADMIN_USER_USERNAME, TestConstant.ADMIN_USER_PASSWORD)
        val runtimeNodeId = setSshRuntimeNode(sshServerTag)
        val treeNode = findJvmTreeNode(runtimeNodeId)
        val channelId = prepareChannel(runtimeNodeId, treeNode, sshServerTag)

        testChannel(channelId)
    }

    /**
     * @return runtimeNodeId
     */
    private fun setSshRuntimeNode(sshServerTag: String): String {
        val sshServer = setupSshServer(sshServerTag)

        return client
            .post()
            .uri("spectre-api/runtime-node/create")
            .cookies(cookiesConsumer)
            .bodyValue(
                mutableMapOf(
                    "name" to "test",
                    "pluginId" to SshRuntimeNodeExtension.ID,
                    "configuration" to
                        jsonMapper.writeValueAsString(
                            SshRuntimeNodeConfig(
                                null,
                                SshRuntimeNodeConfig.Local(true, "/opt/java/openjdk"),
                                sshServer.host,
                                sshServer.firstMappedPort,
                                "root",
                                SshRuntimeNodeConfig.LoginPrincipal(
                                    SshRuntimeNodeConfig.LoginType.PASSWORD,
                                    "P@ssw0rd",
                                    null,
                                    null,
                                ),
                                "/opt/spectre",
                            ),
                        ),
                    "restrictedMode" to true,
                ),
            ).exchange()
            .expectStatus()
            .isOk
            .expectBody<String>()
            .returnResult()
            .responseBody!!
    }

    private fun setupSshServer(sshServerTag: String): GenericContainer<*> {
        val container =
            GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSH_WITH_MATH_GAME_PREFIX + sshServerTag)).apply {
                withExposedPorts(22)
            }
        container.start()

        return container
    }

    override fun findJvmTreeNode(runtimeNodeId: String): List<JvmTreeNodeDTO> {
        val treeNode =
            client
                .post()
                .uri("spectre-api/runtime-node/expand-tree")
                .cookies(cookiesConsumer)
                .bodyValue(
                    mutableMapOf(
                        "runtimeNodeId" to runtimeNodeId,
                    ),
                ).exchange()
                .expectBodyList<JvmTreeNodeDTO>()
                .hasSize(1)
                .returnResult()
                .responseBody!!

        val holder =
            client
                .post()
                .uri("spectre-api/runtime-node/expand-tree")
                .cookies(cookiesConsumer)
                .bodyValue(
                    mutableMapOf(
                        "runtimeNodeId" to runtimeNodeId,
                        "parentNodeId" to treeNode[0].id,
                    ),
                ).exchange()
                .expectBodyList<JvmTreeNodeDTO>()
                .hasSize(1)
                .returnResult()
                .responseBody!!
        return listOf(holder[0])
    }
}
