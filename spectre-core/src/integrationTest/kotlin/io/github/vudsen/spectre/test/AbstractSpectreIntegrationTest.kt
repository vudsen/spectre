package io.github.vudsen.spectre.test

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.ObjectNode
import io.github.vudsen.spectre.SpectreApplication
import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.common.ApplicationContextHolder
import io.github.vudsen.spectre.test.entity.ChannelTestContext
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.graphql.test.autoconfigure.tester.AutoConfigureHttpGraphQlTester
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient
import org.springframework.context.ApplicationContext
import org.springframework.core.io.ClassPathResource
import org.springframework.graphql.test.tester.HttpGraphQlTester
import org.springframework.http.client.MultipartBodyBuilder
import org.springframework.test.web.reactive.server.WebTestClient
import org.springframework.test.web.reactive.server.expectBody
import org.springframework.util.MultiValueMap
import org.springframework.web.reactive.function.BodyInserters
import java.util.function.Consumer


@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@AutoConfigureWebTestClient
@AutoConfigureHttpGraphQlTester
@SpringBootTest(classes = [SpectreApplication::class], webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
abstract class AbstractSpectreIntegrationTest {

    protected val objectMapper = ObjectMapper()

    @Autowired
    lateinit var graphQlTester: HttpGraphQlTester

    @Autowired
    lateinit var client: WebTestClient

    var cookiesConsumer: Consumer<MultiValueMap<String, String>> = {}

    @BeforeEach
    fun beforeAll(@Autowired applicationContext: ApplicationContext) {
        ApplicationContextHolder.applicationContext = applicationContext
    }

    @AfterEach
    fun afterEach() {
        GlobalDisposer.destroy()
    }

    protected fun setupCookies(username: String, password: String) {
        val responseCookies = client.post().uri("spectre-api/auth/login")
            .bodyValue(
                mutableMapOf(
                    "username" to username,
                    "password" to password
                )
            )
            .exchange()
            .expectStatus()
            .isOk
            .returnResult()
            .responseCookies

        val valueMap = MultiValueMap.fromSingleValue<String, String>(mutableMapOf())
        for (entry in responseCookies) {
            for (cookie in entry.value) {
                valueMap.add(entry.key, cookie.value)
            }
        }
        cookiesConsumer = { cookies -> cookies.addAll(valueMap) }
    }


    protected fun findLatestBundleId(): String {
        return graphQlTester
            .mutate()
            .webTestClient { client -> client.defaultCookies(cookiesConsumer) }
            .build().document(
                """query ListToolchainBundles {
                        toolchain {
                            toolchainBundles(page: 0, size: 10) {
                                result {
                                    id
                                }
                            }
                        }
                    }
                """.trimIndent()
            )
            .execute()
            .returnResponse()
            .field("toolchain.toolchainBundles.result[0].id")
            .getValue()!!
    }

    protected abstract fun findJvmTreeNode(runtimeNodeId: String): JvmTreeNodeDTO

    protected fun prepareChannel(runtimeNodeId: String, treeNode: JvmTreeNodeDTO): ChannelTestContext {
        val bundleId = findLatestBundleId()

        var channelId = ""
        while (true) {
            val attachStatus = client.post().uri("spectre-api/arthas/create-channel")
                .cookies(cookiesConsumer)
                .bodyValue(
                    mutableMapOf(
                        "bundleId" to bundleId,
                        "runtimeNodeId" to runtimeNodeId,
                        "treeNodeId" to treeNode.id
                    )
                ).exchange()
                .expectBody<AttachStatus>()
                .returnResult().responseBody!!
            attachStatus.channelId?.let {
                if (attachStatus.isReady) {
                    channelId = it
                    break
                }
            }
        }

        client.post().uri("spectre-api/arthas/channel/$channelId/join")
            .cookies(cookiesConsumer)
            .exchange()
            .expectStatus()
            .isOk
            .expectBody<ArthasConsumerDTO>()
            .returnResult()
            .responseBody!!
        return ChannelTestContext(channelId, runtimeNodeId)
    }

    private fun executeArthasCommand(channelId: String, command: String) {
        client.post().uri("spectre-api/arthas/channel/$channelId/execute")
            .cookies(cookiesConsumer)
            .bodyValue(mutableMapOf(
                "command" to command
            ))
            .exchange()
            .expectStatus()
            .isOk
    }

    private fun pullResultSync(channelId: String): ArrayNode {
        var r: ArrayNode? = null
        loop(5) {
            val raw = client.get().uri("spectre-api/arthas/channel/${channelId}/pull-result")
                .cookies(cookiesConsumer)
                .exchange()
                .expectStatus()
                .isOk
                .expectBody<String>()
                .returnResult()
                .responseBody
            val result = objectMapper.readTree(raw)
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

    private fun testBasicCommand(info: ChannelTestContext) {
        executeArthasCommand(info.channelId, "sc demo.*")

        val node = pullResultSync(info.channelId)
        val scResult = node.get(2) as ObjectNode
        val classes = scResult.get("classNames") as ArrayNode

        Assertions.assertIterableEquals(listOf("demo.MathGame"), classes.map { node -> node.asText() })
    }

    protected fun testChannel(context: ChannelTestContext) {
        val bytes = client.get().uri("spectre-api/arthas/channel/${context.channelId}/pull-result")
            .cookies(cookiesConsumer)
            .exchange()
            .expectStatus()
            .isOk
            .expectBody()
            .returnResult()
            .responseBody

        val jsonNodes = objectMapper.readTree(bytes)

        assertEquals(4, jsonNodes.size())
        assertEquals("Welcome to arthas!", jsonNodes[1].get("message").textValue())

        testBasicCommand(context)
        testRetransform(context)
        testRestart(context)
    }

    /**
     * 测试服务重启，缓存清空
     */
    private fun testRestart(context: ChannelTestContext) {
        client.post().uri("spectre-api/admin-tools/clear-arthas-instance")
            .cookies(cookiesConsumer)
            .exchange()
            .expectStatus()
            .isOk

        val treeNode = findJvmTreeNode(context.runtimeNodeId)
        val newChannelId = prepareChannel(context.runtimeNodeId, treeNode)
        assertEquals(context.channelId, newChannelId.channelId)
    }

    protected fun testRetransform(info: ChannelTestContext) {
        val builder = MultipartBodyBuilder()

        builder.part("file", ClassPathResource("MathGame.class"))

        val raw = client.post().uri("spectre-api/arthas/channel/${info.channelId}/retransform")
            .cookies(cookiesConsumer)
            .body(BodyInserters.fromMultipartData(builder.build()))
            .exchange()
            .expectStatus()
            .isOk
            .expectBody<String>()
            .returnResult()
            .responseBody!!
        val result = objectMapper.readTree(raw)

        val target = result.find { item -> item.get("type").textValue() == "retransform" }!!

        val jobId = target.get("jobId").numberValue().toInt()

        val status = result.find { item -> item.get("jobId").numberValue().toInt() == jobId && item.get("type").textValue() == "status" }!!
        assertEquals(status.get("statusCode").numberValue().toInt(), 0)

        executeArthasCommand(info.channelId, "watch demo.MathGame primeFactors -n 2 -x 1 'target.illegalArgumentCount'")

        val record = arrayOf(Int.MAX_VALUE, Int.MAX_VALUE)
        val exactNumberRegx = Regex("@Integer\\[(-?\\d+)]")
        var rp = 0
        loop(5) {
            val r = pullResultSync(info.channelId)
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

}