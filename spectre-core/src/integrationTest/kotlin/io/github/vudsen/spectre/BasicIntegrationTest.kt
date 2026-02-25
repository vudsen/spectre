package io.github.vudsen.spectre

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.common.ApplicationContextHolder
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeConfig
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeExtension
import io.github.vudsen.spectre.test.MyWebTestClientCustomizer
import io.github.vudsen.spectre.test.TestConstant
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.graphql.test.autoconfigure.tester.AutoConfigureHttpGraphQlTester
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient
import org.springframework.context.ApplicationContext
import org.springframework.context.annotation.Import
import org.springframework.graphql.test.tester.HttpGraphQlTester
import org.springframework.test.web.reactive.server.WebTestClient
import org.springframework.test.web.reactive.server.expectBody
import org.springframework.test.web.reactive.server.expectBodyList
import org.springframework.util.MultiValueMap
import org.testcontainers.containers.GenericContainer
import org.testcontainers.utility.DockerImageName


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@AutoConfigureHttpGraphQlTester
@Import(MyWebTestClientCustomizer::class)
class BasicIntegrationTest {

    @Autowired
    lateinit var graphQlTester: HttpGraphQlTester

    @Autowired
    lateinit var client: WebTestClient

    var cookies: MultiValueMap<String, String> = MultiValueMap.fromSingleValue(emptyMap())

    @BeforeEach
    fun beforeAll(@Autowired applicationContext: ApplicationContext) {
        ApplicationContextHolder.applicationContext = applicationContext
    }

    val objectMapper = ObjectMapper()

    private fun setupSshServer(): GenericContainer<*> {
        val container = GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSH_WITH_MATH_GAME)).apply {
            withExposedPorts(22)
        }
        container.start()

        return container
    }

    private fun setupSession() {
        val responseCookies = client.post().uri("spectre-api/auth/login")
            .cookies { cookies -> cookies.addAll(this@BasicIntegrationTest.cookies) }
            .bodyValue(
                mutableMapOf(
                    "username" to TestConstant.ADMIN_USER_USERNAME,
                    "password" to TestConstant.ADMIN_USER_PASSWORD
                )
            )
            .exchange()
            .expectStatus()
            .isOk
            .returnResult()
            .responseCookies

        val valueMap = MultiValueMap.fromSingleValue<String, String>(mutableMapOf())
        for (entry in responseCookies) {
            for (cookie in entry.value) {
                valueMap.add(entry.key, cookie.value)
            }
        }
        cookies = valueMap
    }

    @Test
    fun testFullBusinessFlow() {
        setupSession()
        val runtimeNodeId = setRuntimeNode()
        val channelId = prepareChannel(runtimeNodeId)

        val bytes = client.get().uri("spectre-api/arthas/channel/${channelId}/pull-result")
            .cookies { cookies -> cookies.addAll(this@BasicIntegrationTest.cookies) }
            .exchange()
            .expectStatus()
            .isOk
            .expectBody()
            .returnResult()
            .responseBody

        val jsonNodes = objectMapper.readTree(bytes)

        Assertions.assertEquals(4, jsonNodes.size())
        Assertions.assertEquals("Welcome to arthas!", jsonNodes[1].get("message").textValue())
    }

    /**
     * @return channelId
     */
    private fun prepareChannel(runtimeNodeId: String): String {
        val treeNode = findJvmTreeNode(runtimeNodeId)

        val bundleId = graphQlTester
            .mutate()
            .webTestClient { client -> client.defaultCookies { cks -> cks.addAll(cookies) } }
            .build().document(
            """query ListToolchainBundles {
                        toolchain {
                            toolchainBundles(page: 0, size: 10) {
                                result {
                                    id
                                }
                            }
                        }
                    }
                """.trimIndent()
        )
            .execute()
            .returnResponse()
            .field("toolchain.toolchainBundles.result[0].id")
            .getValue<String>()!!

        var channelId = ""
        while (true) {
            val attachStatus = client.post().uri("spectre-api/arthas/create-channel")
                .cookies { cookies -> cookies.addAll(this@BasicIntegrationTest.cookies) }
                .bodyValue(
                    mutableMapOf(
                        "bundleId" to bundleId,
                        "runtimeNodeId" to runtimeNodeId,
                        "treeNodeId" to treeNode.id
                    )
                ).exchange()
                .expectBody<AttachStatus>()
                .returnResult().responseBody!!
            attachStatus.channelId?.let {
                if (attachStatus.isReady) {
                    channelId = it
                    break
                }
            }
        }

        client.post().uri("spectre-api/arthas/channel/$channelId/join")
            .cookies { cookies -> cookies.addAll(this@BasicIntegrationTest.cookies) }
            .exchange()
            .expectStatus()
            .isOk
            .expectBody<ArthasConsumerDTO>()
            .returnResult()
        return channelId
    }

    private fun findJvmTreeNode(runtimeNodeId: String): JvmTreeNodeDTO {
        val treeNode = client.post().uri("spectre-api/runtime-node/expand-tree")
            .cookies { cookies -> cookies.addAll(this@BasicIntegrationTest.cookies) }
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
            .cookies { cookies -> cookies.addAll(this@BasicIntegrationTest.cookies) }
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

        client.post().uri("spectre-api/runtime-node/create")
            .cookies { cookies -> cookies.addAll(this@BasicIntegrationTest.cookies) }
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

        return graphQlTester
            .mutate()
            .webTestClient { client -> client.defaultCookies { cks -> cks.addAll(cookies) } }
            .build()
            .document("""query QueryRuntimeNodes{
                     runtimeNode {
                      runtimeNodes(page: 0, size: 10) {
                        result {
                          id
                          name
                          labels
                        }
                      }
                    }
                }    
                """.trimIndent())
            .execute()
            .returnResponse()
            .field("runtimeNode.runtimeNodes.result[0].id")
            .getValue()!!
    }

}