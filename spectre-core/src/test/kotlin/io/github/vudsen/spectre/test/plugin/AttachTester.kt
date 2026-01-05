package io.github.vudsen.spectre.test.plugin

import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.ObjectNode
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeConfig
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeExtension
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.loop
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import org.springframework.util.ResourceUtils
import org.testcontainers.containers.GenericContainer
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
import org.testcontainers.utility.DockerImageName

@Component
class AttachTester {

    companion object {
        private val logger = LoggerFactory.getLogger(AttachTester::class.java)
    }

    @set:Autowired
    lateinit var runtimeNodeService: RuntimeNodeService


    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService



    fun testAttach(runtimeNodeId: Long, jvmNode: JvmTreeNodeDTO) {
        val channelId = doAttach(runtimeNodeId, jvmNode)
        val sessionDTO = arthasExecutionService.joinChannel(channelId, "test")
        arthasExecutionService.execAsync(channelId, "sc demo.*")

        checkScResult(pullResultSync(channelId, sessionDTO.consumerId))
        testRetransform(channelId, sessionDTO.consumerId)
    }

    fun pullResultSync(channelId: String, consumerId: String): ArrayNode {
        var r: ArrayNode? = null
        loop(5) {
            val result = arthasExecutionService.pullResults(channelId, consumerId)
            if (result is ArrayNode) {
                if (result.isEmpty) {
                    return@loop null
                }
                r = result
                return@loop true
            } else {
                Assertions.fail("Invalid type: ${result::class.java}")
            }
        }
        return r!!
    }

    private fun doAttach(
        runtimeNodeId: Long,
        jvmNode: JvmTreeNodeDTO
    ): String {
        val status = loop(20) {
            val attachStatus = arthasExecutionService.requireAttach(
                runtimeNodeId,
                jvmNode.id,
                TestConstant.TOOLCHAIN_BUNDLE_LATEST_ID
            )
            attachStatus.error?.let {
                Assertions.fail<Unit>("Failed to attach: ${it.message}")
            }
            if (attachStatus.isReady) {
                return@loop attachStatus
            }
            return@loop null
        }

        Assertions.assertTrue(status.isReady, "Attach timeout!")
        Assertions.assertNotNull(status.channelId, "Attach timeout!")
        val channelId = status.channelId!!
        return channelId
    }

    private fun checkScResult(node: ArrayNode) {
        Assertions.assertTrue(node.size() == 10)
        val messageNode = node.get(1) as ObjectNode
        Assertions.assertEquals("Welcome to arthas!", messageNode.get("message").asText())
        val scResult = node.get(6) as ObjectNode
        val classes = scResult.get("classNames") as ArrayNode

        Assertions.assertIterableEquals(listOf("demo.MathGame"), classes.map { node -> node.asText() })
    }

    private fun testRetransform(channelId: String, consumerId: String) {
        val result = ResourceUtils.getFile("classpath:MathGame.class").inputStream().use { input ->
            arthasExecutionService.retransform(channelId) { input }
        } as ArrayNode
        val target = result.find { item -> item.get("type").textValue() == "retransform" }!!

        val jobId = target.get("jobId").numberValue().toInt()

        val status = result.find { item -> item.get("jobId").numberValue().toInt() == jobId && item.get("type").textValue() == "status" }!!
        assertEquals(status.get("statusCode").numberValue().toInt(), 0)

        arthasExecutionService.execAsync(channelId, "watch demo.MathGame primeFactors -n 2 -x 1 'target.illegalArgumentCount'")

        val record = arrayOf(Int.MAX_VALUE, Int.MAX_VALUE)
        val exactNumberRegx = Regex("@Integer\\[(\\d+)]")
        var rp = 0
        loop(5) {
            val r = pullResultSync(channelId, consumerId)
            logger.debug("Pull result: {}", r)
            val watchResult = r.filter { item -> item.get("type").textValue() == "watch" }
            for (node in watchResult) {
                val value = node.get("value").textValue()
                val matchResult = exactNumberRegx.find(value)
                if (matchResult == null) {
                    Assertions.fail("Can't parse number from '${value}'")
                } else {
                    record[rp] = matchResult.groupValues[1].toInt()
                    rp++
                }
            }
            if (rp == record.size) {
                return@loop true
            }
            return@loop null
        }
        assertTrue(record[0] > record[1])
    }

    private val commonRuntimeNodeId: Long by lazy {
        val container = GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSH_WITH_MATH_GAME)).apply {
            withExposedPorts(22)
        }
        container.start();

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
        runtimeNodeService.saveRuntimeNode(
            RuntimeNodePO(
                name = "Test Node",
                pluginId = SshRuntimeNodeExtension.ID,
                configuration = objectMapper.writeValueAsString(conf),
                restrictedMode = true
            )
        ).id!!
    }

    /**
     * 获取一个通用的 channel
     * @return channelId
     */
    fun resolveDefaultChannel(): String {
        val root = runtimeNodeService.expandRuntimeNodeTree(commonRuntimeNodeId, null)
        val localeNode = root[0]

        val localJvms =
            runtimeNodeService.expandRuntimeNodeTree(commonRuntimeNodeId, localeNode.id)

        val mathGame = localJvms[0]
        Assertions.assertTrue(mathGame.isJvm)

        return doAttach(commonRuntimeNodeId, mathGame)
    }

}