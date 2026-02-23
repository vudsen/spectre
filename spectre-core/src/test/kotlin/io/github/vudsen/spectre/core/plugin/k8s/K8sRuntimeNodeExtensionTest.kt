package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import io.github.vudsen.spectre.test.AbstractSpectreTest
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.plugin.AttachTester
import org.junit.jupiter.api.Assertions
import org.springframework.beans.factory.annotation.Autowired
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
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
        val endpoint = System.getenv(TestConstant.ENV_K8S_ENDPOINT)
        // kubectl create token spectre -n spectre
        val token = System.getenv(TestConstant.ENV_K8S_TOKEN)
        val runtimeNodeConfig = K8sRuntimeNodeConfig(
            endpoint,
            token,
            "/opt/spectre",
            true
        )
        val runtimeNodeId = runtimeNodeService.createRuntimeNode(
            RuntimeNodePO(
                name = "K8s",
                pluginId = K8sRuntimeNodeExtension.ID,
                configuration = ObjectMapper().writeValueAsString(runtimeNodeConfig)
            )
        ).id

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


}