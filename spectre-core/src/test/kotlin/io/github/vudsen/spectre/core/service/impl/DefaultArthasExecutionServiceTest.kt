package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.test.AbstractSpectreTest
import io.github.vudsen.spectre.test.plugin.AttachTester
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class DefaultArthasExecutionServiceTest : AbstractSpectreTest() {

    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService

    @set:Autowired
    lateinit var attachTester: AttachTester

    @Test
    fun checkOgnlExpression() {
        val defaultChannel = attachTester.resolveDefaultChannel()
        assertThrows(BusinessException::class.java) {
            arthasExecutionService.execAsync(defaultChannel, "ognl 'T(java.lang.Runtime).getRuntime().exec('rm -rf /')'")
        }
        assertThrows(BusinessException::class.java) {
            arthasExecutionService.execAsync(defaultChannel, "ognl \"''.getClass().forName('java.lang.Runtime')\"")
            val sessionDTO =
                arthasExecutionService.joinChannel(defaultChannel, DefaultArthasExecutionServiceTest::class.java.name)
            val r = attachTester.pullResultSync(defaultChannel, sessionDTO.consumerId)
            print(r)
        }
        assertThrows(BusinessException::class.java) {
            arthasExecutionService.execAsync(defaultChannel, "ognl '(#root.class.forName('java.lang.Runtime'))\n'")
        }

    }

}