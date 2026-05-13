package io.github.vudsen.spectre.test.plugin

import io.github.vudsen.spectre.api.dto.CreateRuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.ArthasInstanceService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeConfig
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeExtension
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.loop
import org.junit.jupiter.api.Assertions
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import org.testcontainers.containers.GenericContainer
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
import org.testcontainers.utility.DockerImageName

@Component
class AttachTester {
    @set:Autowired
    lateinit var runtimeNodeService: RuntimeNodeService

    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService

    @set:Autowired
    lateinit var arthasInstanceService: ArthasInstanceService

    /**
     * @return channelId
     */
    fun attachSync(
        runtimeNodeId: Long,
        jvmNode: JvmTreeNodeDTO,
    ): String {
        val status =
            loop(20) {
                val attachStatus =
                    arthasExecutionService.requireAttach(
                        runtimeNodeId,
                        jvmNode.id,
                        TestConstant.TOOLCHAIN_BUNDLE_LATEST_ID,
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

    val commonRuntimeNodeId: Long by lazy {
        val container =
            GenericContainer(DockerImageName.parse(TestConstant.DOCKER_IMAGE_SSH_WITH_MATH_GAME)).apply {
                withExposedPorts(22)
            }
        container.start()

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
        runtimeNodeService
            .createRuntimeNode(
                CreateRuntimeNodeDTO().apply {
                    name = "Test Node"
                    pluginId = SshRuntimeNodeExtension.ID
                    configuration = objectMapper.writeValueAsString(conf)
                    restrictedMode = true
                },
            ).id
    }

    fun resolveDefaultJvm(): JvmTreeNodeDTO {
        val root = runtimeNodeService.expandRuntimeNodeTree(commonRuntimeNodeId, null)
        val localeNode = root[0]

        val localJvms =
            runtimeNodeService.expandRuntimeNodeTree(commonRuntimeNodeId, localeNode.id)

        val mathGame = localJvms[0]
        Assertions.assertTrue(mathGame.isJvm)
        return mathGame
    }

    /**
     * 获取一个通用的 channel
     * @return channelId
     */
    fun resolveDefaultChannel(): String = attachSync(commonRuntimeNodeId, resolveDefaultJvm())
}
