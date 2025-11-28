package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.SpectreApplication
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.TestContainerUtils
import io.github.vudsen.spectre.test.loop
import org.junit.jupiter.api.Assertions
import org.springframework.boot.test.context.SpringBootTest
import org.testcontainers.containers.GenericContainer
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper
import kotlin.test.Test

@SpringBootTest(classes = [SpectreApplication::class], webEnvironment = SpringBootTest.WebEnvironment.NONE)
class SshRuntimeNodeExtensionTest(
    val runtimeNodeService: RuntimeNodeService,
    val arthasExecutionService: ArthasExecutionService
) {

    private fun insertSshRuntimeNode(container: GenericContainer<*>): Long {
        val objectMapper = ObjectMapper()
        val conf = SshRuntimeNodeConfig(
            null,
            SshRuntimeNodeConfig.Local(true, ""),
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

        return runtimeNodeService.saveRuntimeNode(RuntimeNodePO(
            name = "Test Node",
            pluginId = SshRuntimeNodeExtension.ID,
            configuration = objectMapper.writeValueAsString(conf)
        )).id!!
    }

    @Test
    fun testLocalAttach() {
        val container = TestContainerUtils.createMathGameSshMachine()
        val id = insertSshRuntimeNode(container)

        runtimeNodeService.getRuntimeNode(id)!!

        val root = runtimeNodeService.expandRuntimeNodeTree(id, null)
        val localeNode = root.get(0)

        val localJvms =
            runtimeNodeService.expandRuntimeNodeTree(id, localeNode.id)

        val mathGame = localJvms.get(0)
        Assertions.assertTrue(mathGame.isJvm)


        val status = loop(20) {
            val attachStatus = arthasExecutionService.requireAttach(
                id,
                mathGame.id,
                TestConstant.TOOLCHAIN_BUNDLE_LATEST_ID
            )
            if (attachStatus.isReady) {
                return@loop attachStatus
            }
            return@loop null
        }

        Assertions.assertTrue(status.isReady, "Attach timeout!")
        Assertions.assertNotNull(status.channelId, "Attach timeout!")
        val channelId = status.channelId!!
        val sessionDTO = arthasExecutionService.joinChannel(channelId, "test")
        arthasExecutionService.execAsync(channelId, "version")
        arthasExecutionService.pullResults(channelId, sessionDTO.consumerId)

        loop(5) {
            val result = arthasExecutionService.pullResults(channelId, sessionDTO.consumerId)
            println(result)
        }

        println(runtimeNodeService.listPlugins())
    }

}