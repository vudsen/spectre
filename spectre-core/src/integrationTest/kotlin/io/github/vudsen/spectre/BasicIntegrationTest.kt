package io.github.vudsen.spectre

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeConfig
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeExtension
import io.github.vudsen.spectre.test.TestConstant
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext
import org.springframework.test.web.reactive.server.WebTestClient
import org.springframework.test.web.reactive.server.expectBodyList
import org.testcontainers.containers.GenericContainer
import org.testcontainers.utility.DockerImageName


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BasicIntegrationTest {

    private lateinit var client: WebTestClient


    @BeforeEach
    fun setUp(@Autowired context: ApplicationContext) {
        // 构建一个会自动保存和发送 Cookie 的客户端
        this.client = WebTestClient.bindToApplicationContext(context)
            .configureClient()
            .baseUrl("/spectre-api")
            .build()
    }

    private fun setupSshServer(): GenericContainer<*> {
        val container = GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSH_WITH_MATH_GAME)).apply {
            withExposedPorts(22)
        }
        container.start()

        return container
    }

    @Test
    fun testFullBusinessFlow() {
        client.post().uri("auth/login")
            .bodyValue(
                mutableMapOf(
                    "username" to TestConstant.ADMIN_USER_USERNAME,
                    "password" to TestConstant.ADMIN_USER_PASSWORD
                )
            )
            .exchange()
            .expectStatus()
            .isOk

        val runtimeNodeId = setRuntimeNode()
        val jvmNode = findJvmTreeNode(runtimeNodeId)



//        while (true) {
//            client.post().uri("arthas/create-channel")
//                .bodyValue(mutableMapOf(
//                    "bundle"
//                ))
//
//        }



    }

    private fun findJvmTreeNode(runtimeNodeId: String): JvmTreeNodeDTO {
        val treeNode = client.post().uri("runtime-node/expand-tree")
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


        val holder = client.post().uri("runtime-node/expand-tree")
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

    /**
     * @return runtimeNodeId
     */
    private fun setRuntimeNode(): String {
        val sshServer = setupSshServer()

        val objectMapper = ObjectMapper()
        client.post().uri("runtime-node/create")
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

        val result = client.post().uri("graphql")
            .bodyValue(
                mutableMapOf(
                    "query" to """query QueryRuntimeNodes{
                     runtimeNode {
                      runtimeNodes(page: 0, size: 10) {
                        totalPages
                        result {
                          id
                          name
                          labels
                        }
                      }
                    }
                }    
                """.trimIndent()
                )
            ).exchange()
            .expectBody()
            .jsonPath("$.result.runtimeNode.runtimeNodes[0].id")
            .exists()
            .returnResult()

        return String(result.responseBodyContent!!)
    }

}