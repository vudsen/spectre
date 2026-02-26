package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.api.dto.CreateRuntimeNodeDTO
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.test.AbstractSpectreTest
import io.github.vudsen.spectre.test.loop
import io.github.vudsen.spectre.test.plugin.AttachTester
import okhttp3.OkHttpClient
import org.junit.jupiter.api.Assertions
import org.springframework.beans.factory.annotation.Autowired
import org.testcontainers.images.builder.Transferable
import org.testcontainers.k3s.K3sContainer
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
import org.testcontainers.utility.DockerImageName
import java.util.logging.Level
import java.util.logging.Logger
import kotlin.test.Test


class K8sRuntimeNodeExtensionTest : AbstractSpectreTest() {

    @set:Autowired
    lateinit var runtimeNodeService: RuntimeNodeService

    @set:Autowired
    lateinit var attachTester: AttachTester

    /**
     * Use external K8s
     */
    @Test
    fun testK8sAttach() {
        Logger.getLogger(OkHttpClient::class.java.getName()).setLevel(Level.FINE)
        val runtimeNodeId = setupK3s()

        val root = runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, null)
        val k8sNode = root.find { node -> node.name == "spectre" }
        Assertions.assertNotNull(k8sNode)
        k8sNode!!

        val spectreNs =
            runtimeNodeService.expandRuntimeNodeTree(runtimeNodeId, k8sNode.id)

        val match = Regex("math-game-[\\w-]+ \\(Pod\\) \\(Running\\)")
        val mathGame = spectreNs.find { pod -> pod.name.matches(match) }
        Assertions.assertNotNull(mathGame, "Can't find specific pod(math-game), available pods: $spectreNs")
        mathGame!!
        Assertions.assertTrue(mathGame.isJvm)
        attachTester.testAttach(runtimeNodeId, mathGame)
    }

    private fun setupK3s(): Long {
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

        val runtimeNodeConfig = K8sRuntimeNodeConfig(
            endpoint,
            token,
            "/opt/spectre",
            true
        )
        val runtimeNodeId = runtimeNodeService.createRuntimeNode(
            CreateRuntimeNodeDTO().apply {
                name = "K8s"
                pluginId = K8sRuntimeNodeExtension.ID
                configuration = ObjectMapper().writeValueAsString(runtimeNodeConfig)
            }
        ).id
        return runtimeNodeId
    }


}