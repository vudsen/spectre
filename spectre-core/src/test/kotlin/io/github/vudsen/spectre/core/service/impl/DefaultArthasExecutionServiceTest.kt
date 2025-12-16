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
        }
        assertThrows(BusinessException::class.java) {
            arthasExecutionService.execAsync(defaultChannel, "ognl \"(#root.class.forName('java.lang.Runtime'))\"")
        }
        assertThrows(BusinessException::class.java) {
            // test prase failed.
            arthasExecutionService.execAsync(defaultChannel, "ognl \"exawxe-=-+\"")
        }
        assertThrows(BusinessException::class.java) {
            arthasExecutionService.execAsync(defaultChannel, "ognl '#root.toString()'")
        }

        arthasExecutionService.execAsync(defaultChannel, "watch demo.MathGame primeFactors \"{params[0],target}\" \"params[0]<0\"")
        arthasExecutionService.interruptCommand(defaultChannel)
        arthasExecutionService.execAsync(defaultChannel, "ognl '#root.fake'")
        arthasExecutionService.execAsync(defaultChannel, "watch demo.MathGame primeFactors \"{params,returnObj}\" -x 2 -b")
        arthasExecutionService.interruptCommand(defaultChannel)
        val sessionDTO =
            arthasExecutionService.joinChannel(defaultChannel, DefaultArthasExecutionServiceTest::class.java.name)
        val r = attachTester.pullResultSync(defaultChannel, sessionDTO.consumerId)
        print(r)

    }

}