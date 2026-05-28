package io.github.vudsen.spectre.test

import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.vo.ChannelInfoVO
import io.github.vudsen.spectre.test.entity.ChannelTestContext
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.springframework.core.io.ClassPathResource
import org.springframework.http.client.MultipartBodyBuilder
import org.springframework.test.web.reactive.server.expectBody
import org.springframework.web.reactive.function.BodyInserters
import tools.jackson.databind.JsonNode
import tools.jackson.databind.node.ArrayNode
import tools.jackson.databind.node.ObjectNode

abstract class BaseSpectreIntegrationTest : AbstractSpectreIntegrationTest() {
    protected fun findLatestBundleId(): String =
        graphQlTester
            .mutate()
            .webTestClient { client -> client.defaultCookies(cookiesConsumer) }
            .build()
            .document(
                """
                query ListToolchainBundles {
                    toolchain {
                        toolchainBundles(page: 0, size: 10) {
                            result {
                                id
                            }
                        }
                    }
                }
                """.trimIndent(),
            ).execute()
            .returnResponse()
            .field("toolchain.toolchainBundles.result[0].id")
            .getValue()!!

    protected abstract fun findJvmTreeNode(runtimeNodeId: String): List<JvmTreeNodeDTO>

    protected fun prepareChannel(
        runtimeNodeId: String,
        treeNodes: List<JvmTreeNodeDTO>,
        javaVersion: String,
    ): ChannelTestContext {
        val bundleId = findLatestBundleId()
        val instancesIds = treeNodes.map { node -> node.id }
        val channelId: String =
            if (treeNodes.size == 1) {
                loop(30) {
                    val attachStatus =
                        client
                            .post()
                            .uri("spectre-api/arthas/create-channel")
                            .cookies(cookiesConsumer)
                            .bodyValue(
                                mutableMapOf(
                                    "bundleId" to bundleId,
                                    "runtimeNodeId" to runtimeNodeId,
                                    "treeNodeId" to treeNodes[0].id,
                                ),
                            ).exchange()
                            .expectBody<AttachStatus>()
                            .returnResult()
                            .responseBody!!
                    attachStatus.treeNodeId?.let {
                        if (attachStatus.isReady) {
                            return@loop it
                        }
                    }
                    return@loop null
                }
            } else {
                loop(30) {
                    val statues =
                        client
                            .post()
                            .uri("spectre-api/arthas/batch/create-instances")
                            .cookies(cookiesConsumer)
                            .bodyValue(
                                treeNodes.map { node ->
                                    mapOf(
                                        "bundleId" to bundleId,
                                        "treeNodeId" to node.id,
                                        "runtimeNodeId" to runtimeNodeId,
                                    )
                                },
                            ).exchange()
                            .expectStatus()
                            .isOk
                            .expectBody<Map<String, AttachStatus>>()
                            .returnResult()
                            .responseBody!!
                    var readyCnt = 0
                    for (status in statues) {
                        if (status.value.isReady) {
                            readyCnt++
                        }
                    }
                    if (readyCnt == treeNodes.size) {
                        return@loop true
                    }
                    return@loop null
                }

                val jsonStringBody =
                    client
                        .post()
                        .uri("spectre-api/arthas/batch/create-channel")
                        .cookies(cookiesConsumer)
                        .bodyValue(instancesIds)
                        .exchange()
                        .expectStatus()
                        .isOk
                        .expectBody<String>()
                        .returnResult()
                        .responseBody!!
                jsonMapper.readValue(jsonStringBody, String::class.java)
            }

        client
            .post()
            .uri("spectre-api/arthas/channel/$channelId/join")
            .cookies(cookiesConsumer)
            .exchange()
            .expectStatus()
            .isOk
            .expectBody<List<ChannelInfoVO>>()
            .returnResult()
            .responseBody!!
        return ChannelTestContext(channelId, runtimeNodeId, javaVersion, instancesIds)
    }

    private fun executeArthasCommand(
        channelId: String,
        command: String,
    ) {
        client
            .post()
            .uri("spectre-api/arthas/channel/$channelId/execute")
            .cookies(cookiesConsumer)
            .bodyValue(
                mutableMapOf(
                    "command" to command,
                ),
            ).exchange()
            .expectStatus()
            .isOk
    }

    /**
     * 同步拉取结果，该方法会保证所有实例的消息都非空
     */
    private fun pullResultSync(context: ChannelTestContext): Map<String, JsonNode> {
        val r = HashMap<String, JsonNode>()
        loop(5) {
            val raw =
                client
                    .get()
                    .uri("spectre-api/arthas/channel/${context.channelId}/pull-result")
                    .cookies(cookiesConsumer)
                    .exchange()
                    .expectStatus()
                    .isOk
                    .expectBody<Map<String, JsonNode>>()
                    .returnResult()
                    .responseBody
            for (entry in raw!!.entries) {
                val instanceId = entry.key
                val nodes = entry.value as ArrayNode
                if (!nodes.isEmpty) {
                    r[instanceId] = nodes
                }
            }
            if (r.size == context.instanceIds.size) {
                return@loop true
            }
            return@loop null
        }
        return r
    }

    private fun testBasicCommand(info: ChannelTestContext) {
        executeArthasCommand(info.channelId, "sc demo.*")

        val results = pullResultSync(info)
        for (instanceId in info.instanceIds) {
            val node = results[instanceId]!!
            val scResult = node.get(2) as ObjectNode
            val classes = scResult.get("classNames") as ArrayNode

            Assertions.assertIterableEquals(listOf("demo.MathGame"), classes.mapIndexed { _, node -> node.asString() })
        }
    }

    protected fun testChannel(context: ChannelTestContext) {
        testChannel0(context)
        if (context.instanceIds.size == 1) {
            testRetransform(context)
        }
        testRestart(context)
        testInstanceDeleted(context)
    }

    private fun testChannel0(context: ChannelTestContext) {
        val result = pullResultSync(context)
        for (instanceId in context.instanceIds) {
            val jsonNodes = result[instanceId]!!
            assertEquals(4, jsonNodes.size())
            assertEquals("Welcome to arthas!", jsonNodes[1].get("message").stringValue())

            testBasicCommand(context)
        }
    }

    /**
     * 测试服务重启，缓存清空
     */
    private fun testRestart(context: ChannelTestContext) {
        client
            .post()
            .uri("spectre-api/admin-tools/clear-arthas-instance?cleanAll=false")
            .cookies(cookiesConsumer)
            .exchange()
            .expectStatus()
            .isOk

        val treeNodes = findJvmTreeNode(context.runtimeNodeId)
        val newChannelId = prepareChannel(context.runtimeNodeId, treeNodes, context.javaVersion)
        assertEquals(context.channelId, newChannelId.channelId)
    }

    /**
     * 测试服务缓存的 arthasInstance 被删除
     */
    private fun testInstanceDeleted(context: ChannelTestContext) {
        client
            .post()
            .uri("spectre-api/admin-tools/clear-arthas-instance?cleanAll=true")
            .cookies(cookiesConsumer)
            .exchange()
            .expectStatus()
            .isOk

        val treeNode = findJvmTreeNode(context.runtimeNodeId)
        val newChannel = prepareChannel(context.runtimeNodeId, treeNode, context.javaVersion)
        context.channelId = newChannel.channelId
        testChannel0(newChannel)
    }

    protected fun testRetransform(info: ChannelTestContext) {
        val builder = MultipartBodyBuilder()

        builder.part("file", ClassPathResource("MathGame-${info.javaVersion}.class"))

        val raw =
            client
                .post()
                .uri("spectre-api/arthas/channel/${info.channelId}/retransform")
                .cookies(cookiesConsumer)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .exchange()
                .expectStatus()
                .isOk
                .expectBody<String>()
                .returnResult()
                .responseBody!!
        val result = jsonMapper.readTree(raw)

        val target = result.find { item -> item.get("type").stringValue() == "retransform" }
        if (target == null) {
            Assertions.fail<Unit>(result.toPrettyString())
            return
        }

        val jobId = target.get("jobId").numberValue().toInt()

        val status =
            result.find { item ->
                item.get("jobId").numberValue().toInt() == jobId && item.get("type").stringValue() == "status"
            }!!
        assertEquals(status.get("statusCode").numberValue().toInt(), 0)

        executeArthasCommand(info.channelId, "watch demo.MathGame primeFactors -n 2 -x 1 'target.illegalArgumentCount'")

        val record = arrayOf(Int.MAX_VALUE, Int.MAX_VALUE)
        val exactNumberRegx = Regex("@Integer\\[(-?\\d+)]")
        var rp = 0
        val arthasResult = pullResultSync(info)
        for (instanceId in info.instanceIds) {
            val r = arthasResult[instanceId]!!
            val watchResult = r.filter { item -> item.get("type").stringValue() == "watch" }
            for (node in watchResult) {
                val value = node.get("value").stringValue()
                val matchResult = exactNumberRegx.find(value)
                if (matchResult == null) {
                    Assertions.fail("Can't parse number from '$value'")
                } else {
                    record[rp] = matchResult.groupValues[1].toInt()
                    rp++
                }
            }
        }
        assertTrue(record[0] > record[1])
    }
}
