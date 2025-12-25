package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.node.ArrayNode
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.test.AbstractSpectreTest
import io.github.vudsen.spectre.test.loop
import io.github.vudsen.spectre.test.plugin.AttachTester
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.util.ResourceUtils
import java.util.UUID

class DefaultArthasExecutionServiceTest : AbstractSpectreTest() {

    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService

    @set:Autowired
    lateinit var attachTester: AttachTester

    @Test
    fun checkOgnlExpression() {
        val defaultChannel = attachTester.resolveDefaultChannel()
        assertThrows(BusinessException::class.java) {
            arthasExecutionService.execAsync(defaultChannel, "ognl \"T(java.lang.Runtime).getRuntime().exec('touch ~/hacked.txt')\"")
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
    }

    @Test
    fun testRetransform() {
        // 把 illegalArgumentCount++ 替换为 --
        val defaultChannel = attachTester.resolveDefaultChannel()
        val consumer = arthasExecutionService.joinChannel(defaultChannel, UUID.randomUUID().toString())

        val result = ResourceUtils.getFile("classpath:MathGame.class").inputStream().use { input ->
            arthasExecutionService.retransform(defaultChannel) { input }
        } as ArrayNode
        val target = result.find { item -> item.get("type").textValue() == "retransform" }!!

        val jobId = target.get("jobId").numberValue().toInt()

        val status = result.find { item -> item.get("jobId").numberValue().toInt() == jobId && item.get("type").textValue() == "status" }!!
        assertEquals(status.get("statusCode").numberValue().toInt(), 0)

        arthasExecutionService.execAsync(defaultChannel, "watch demo.MathGame primeFactors -n 2 -x 1 'target.illegalArgumentCount'")

        val record = arrayOf(Int.MAX_VALUE, Int.MAX_VALUE)
        val exactNumberRegx = Regex("@Integer\\[(\\d+)]")
        var rp = 0
        loop(5) {
            val r = attachTester.pullResultSync(defaultChannel, consumer.consumerId)
            val watchResult = r.filter { item -> item.get("type").textValue() == "watch" }
            for (node in watchResult) {
                val matchResult = exactNumberRegx.find(node.get("value").textValue())!!
                record[rp] = matchResult.groupValues[1].toInt()
                rp++
            }
            if (rp == record.size) {
                return@loop true
            }
            print(r)
            return@loop null
        }
        assertTrue(record[0] > record[1])

    }

}