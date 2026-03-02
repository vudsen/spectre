package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.test.AbstractSpectreIntegrationTest
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.loop
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.springframework.test.web.reactive.server.expectBody
import org.springframework.test.web.reactive.server.expectBodyList
import org.testcontainers.images.builder.Transferable
import org.testcontainers.k3s.K3sContainer
import org.testcontainers.utility.DockerImageName

class K8sRuntimeNodeIntegrationTest : AbstractSpectreIntegrationTest() {


    @Test
    fun testFullBusinessFlow() {
        setupCookies(TestConstant.ADMIN_USER_USERNAME, TestConstant.ADMIN_USER_PASSWORD)

        val runtimeNodeId = setupK8sRuntimeNode()
        val treeNode = findJvmTreeNode(runtimeNodeId)
        val info = prepareChannel(runtimeNodeId, treeNode)

        testChannel(info)
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
            .returnResult()
            .responseBody!!
            .find { node -> node.name === "spectre" }!!

        val holder = client.post().uri("spectre-api/runtime-node/expand-tree")
            .cookies(cookiesConsumer)
            .bodyValue(
                mutableMapOf(
                    "runtimeNodeId" to runtimeNodeId,
                    "parentNodeId" to treeNode.id
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
    private fun setupK8sRuntimeNode(): String {
        val k3s = K3sContainer(DockerImageName.parse("rancher/k3s:v1.31.0-k3s1"))
            .withCommand("server", "--disable=traefik", "--disable=local-storage")

        k3s.start()
        K8sRuntimeNodeExtensionTest::class.java.classLoader.getResourceAsStream("k8s-deploy.yaml").use { stream ->
            k3s.copyFileToContainer(Transferable.of(stream.readAllBytes()), "/opt/k8s-deploy.yaml")
        }

        k3s.execInContainer("kubectl", "apply", "-f", "/opt/k8s-deploy.yaml").let {
            Assertions.assertEquals(0, it.exitCode, it.stderr)
        }

        val endpoint = "https://${k3s.host}:${k3s.firstMappedPort}"
        // kubectl create token spectre -n spectre
        val result = k3s.execInContainer("kubectl", "create", "token", "spectre", "-n", "spectre")
        Assertions.assertEquals(0, result.exitCode)
        val token = result.stdout

        loop(60) {
            val execInContainer = k3s.execInContainer(
                "kubectl",
                "get",
                "deployment",
                "math-game",
                "-n",
                "spectre",
                "-o",
                "jsonpath='{.status.readyReplicas}'"
            )
            if (execInContainer.stdout == "'1'") {
                return@loop true
            }
            return@loop null
        }

        return client.post().uri("spectre-api/runtime-node/create")
            .cookies(cookiesConsumer)
            .bodyValue(
                mutableMapOf(
                    "name" to "K8s",
                    "pluginId" to K8sRuntimeNodeExtension.ID,
                    "configuration" to objectMapper.writeValueAsString(
                        K8sRuntimeNodeConfig(
                            endpoint,
                            token,
                            "/opt/spectre",
                            true
                        )
                    )
                )
            )
            .exchange()
            .expectStatus()
            .isOk
            .expectBody<String>()
            .returnResult()
            .responseBody!!
    }


}