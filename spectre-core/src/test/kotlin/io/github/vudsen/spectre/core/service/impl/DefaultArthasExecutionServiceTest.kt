package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.test.AbstractSpectreTest
import io.github.vudsen.spectre.test.plugin.AttachTester
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired

class DefaultArthasExecutionServiceTest : AbstractSpectreTest() {

    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService

    @set:Autowired
    lateinit var attachTester: AttachTester

    companion object {
        @JvmStatic
        private val logger = LoggerFactory.getLogger(DefaultArthasExecutionServiceTest::class.java)
    }

    private fun testSplit(input: String): Array<String> {
        // 假设 splitArguments 定义在同包下的工具类中或作为全局函数
        val service = arthasExecutionService as DefaultArthasExecutionService
        return service.splitCommand(input).toTypedArray()
    }

    @Test
    fun `test splitCommand provided samples`() {
        val svc = arthasExecutionService
        if (svc !is DefaultArthasExecutionService) {
            logger.warn("Test case skipped")
            return
        }
        // 样例 1: 基础引号包裹
        assertArrayEquals(
            arrayOf("hello", "wo rld", "!! !!"),
            testSplit("""hello "wo rld" '!! !!'"""),
            "样例 1 失败"
        )

        // 样例 2: 转义字符
        assertArrayEquals(
            arrayOf("hello", "\"wo \"rld", "\\!!'!!"),
            testSplit("""hello "\"wo \"rld" '\\!!\'!!'"""),
            "样例 2 失败"
        )

        // 样例 3: 嵌套引号处理
        assertArrayEquals(
            arrayOf("I", "love 'you'"),
            testSplit("""I "love 'you'""""),
            "样例 3 失败"
        )

        // 样例 4: 多个连续空格
        assertArrayEquals(
            arrayOf("hello", "world"),
            testSplit("""    hello     world     """),
            "样例 4 失败"
        )

        // 样例 5: 未闭合的引号
        assertArrayEquals(
            arrayOf("hello", "my beautiful \"world"),
            testSplit("""hello 'my beautiful "world"""),
            "样例 5 失败"
        )
    }

    @Test
    fun `test splitCommand edge cases`() {
        val svc = arthasExecutionService
        if (svc !is DefaultArthasExecutionService) {
            logger.warn("Test case skipped")
            return
        }
        // 空字符串
        assertArrayEquals(
            emptyArray<String>(),
            testSplit(""),
            "空字符串应该返回空列表"
        )

        // 只有空格
        assertArrayEquals(
            emptyArray<String>(),
            testSplit("    "),
            "仅空格字符串应该返回空列表"
        )

        // 纯转义序列
        assertArrayEquals(
            arrayOf(" ", "\"", "'", "\\"),
            testSplit("""\  \" \' \\"""),
            "转义序列解析错误"
        )

        // 混合复杂情况
        assertArrayEquals(
            arrayOf("cmd", "--name", "John Doe", "--msg", "It's \"OK\""),
            testSplit("""cmd --name "John Doe" --msg 'It\'s "OK"'"""),
            "复杂嵌套解析错误"
        )
    }
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

}