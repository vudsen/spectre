package io.github.vudsen.spectre.core.controller.ws

import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.ChannelService
import io.github.vudsen.spectre.common.util.KeyBasedLock
import io.github.vudsen.spectre.repo.po.ChannelPO
import jakarta.servlet.http.HttpSession
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.task.TaskExecutor
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import tools.jackson.databind.node.ArrayNode
import tools.jackson.databind.node.IntNode
import tools.jackson.databind.node.JsonNodeFactory
import tools.jackson.databind.node.ObjectNode
import tools.jackson.databind.node.StringNode
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch

@Component
class ArthasPullResultCoordinator(
    private val arthasExecutionService: ArthasExecutionService,
    private val channelService: ChannelService,
    @param:Qualifier("applicationTaskExecutor") private val executor: TaskExecutor,
) {
    private val logger = LoggerFactory.getLogger(ArthasPullResultCoordinator::class.java)
    private val joinLock = KeyBasedLock(executor)

    fun joinChannel(
        channelId: String,
        session: HttpSession,
    ): List<String> {
        val channel = resolveChannel(channelId)
        if (channel == null) {
            joinChannelForSingleInstance(session, channelId)
            return listOf(channelId)
        }
        for (instanceId in channel.instanceIds) {
            joinChannelForSingleInstance(session, instanceId)
        }
        return channel.instanceIds
    }

    fun resolveChannel(channelId: String): ChannelPO? =
        channelId.toLongOrNull()?.let {
            channelService.findById(it)
        }

    fun resolveTargetInstanceIds(channelId: String): List<String> = resolveChannel(channelId)?.instanceIds ?: listOf(channelId)

    fun pullResultsForChannel(
        channelId: String,
        session: HttpSession,
    ): Map<String, ArrayNode> {
        val targetInstanceIds = resolveTargetInstanceIds(channelId)
        if (targetInstanceIds.size == 1) {
            return mapOf(targetInstanceIds[0] to pullResults(session, targetInstanceIds[0]))
        }
        val result = ConcurrentHashMap<String, ArrayNode>()
        val latch = CountDownLatch(targetInstanceIds.size)
        val securityContext = SecurityContextHolder.getContext()
        for (instanceId in targetInstanceIds) {
            executor.execute {
                SecurityContextHolder.setContext(securityContext)
                try {
                    result[instanceId] = pullResults(session, instanceId)
                } catch (e: Exception) {
                    result[instanceId] = errorResult(e)
                } finally {
                    SecurityContextHolder.clearContext()
                    latch.countDown()
                }
            }
        }
        latch.await()
        return result
    }

    fun pullResults(
        session: HttpSession,
        instanceId: String,
    ): ArrayNode =
        try {
            val channelSession = resolveChannelSession(session, instanceId)
            arthasExecutionService.pullResults(instanceId, channelSession.consumerId)
        } catch (_: ConsumerNotFountException) {
            recreateConsumerAndPull(session, instanceId)
        }

    fun errorResult(e: Exception): ArrayNode {
        val node = ArrayNode(JsonNodeFactory.instance)
        node.add(createErrorMsg(exactErrorMsg(e)))
        return node
    }

    fun exactErrorMsg(e: Exception): String =
        if (e is BusinessException) {
            e.toI18nMessage()
        } else {
            logger.error("", e)
            "Internal Server Error"
        }

    fun createErrorMsg(msg: String): ObjectNode =
        ObjectNode(JsonNodeFactory.instance).apply {
            this["type"] = StringNode("message")
            this["jobId"] = IntNode((System.currentTimeMillis() / 1000).toInt())
            this["message"] = StringNode(msg)
        }

    fun removeChannelSession(
        session: HttpSession,
        instanceId: String,
    ) {
        session.removeAttribute(channelSessionDataKey(instanceId))
    }

    fun resolveChannelSession(
        session: HttpSession,
        instanceId: String,
    ): ArthasConsumerDTO =
        session.getAttribute(channelSessionDataKey(instanceId)) as ArthasConsumerDTO?
            ?: throw BusinessException("error.channel.not.exist")

    private fun channelSessionDataKey(instanceId: String): String = "InstanceIdToConsumerId:$instanceId"

    private fun joinChannelForSingleInstance(
        session: HttpSession,
        instanceId: String,
    ): ArthasConsumerDTO {
        val lockKey = session.id + ":" + instanceId
        joinLock.lock(lockKey) {
            val key = channelSessionDataKey(instanceId)
            val oldConsumerId = session.getAttribute(key) as ArthasConsumerDTO?
            if (oldConsumerId != null) {
                return oldConsumerId
            }
            val detail = arthasExecutionService.joinChannel(instanceId, session.id)
            session.setAttribute(key, detail)
            return detail
        }
    }

    private fun recreateConsumerAndPull(
        session: HttpSession,
        instanceId: String,
    ): ArrayNode {
        session.removeAttribute(channelSessionDataKey(instanceId))
        try {
            val consumerDTO = joinChannelForSingleInstance(session, instanceId)
            return arthasExecutionService.pullResults(instanceId, consumerDTO.consumerId)
        } catch (_: ConsumerNotFountException) {
            throw NamedExceptions.SESSION_EXPIRED.toException()
        }
    }
}
