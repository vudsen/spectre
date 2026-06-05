package io.github.vudsen.spectre.core.controller.ws

import io.github.vudsen.spectre.common.util.GLOBAL_JSON_MAPPER
import io.github.vudsen.spectre.common.util.toJsonString
import jakarta.servlet.http.HttpSession
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.task.TaskExecutor
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler
import java.util.concurrent.ConcurrentHashMap

@Component
class ArthasChannelResultWebSocketHandler(
    private val arthasPullResultCoordinator: ArthasPullResultCoordinator,
    @param:Qualifier("applicationTaskExecutor") private val executor: TaskExecutor,
) : TextWebSocketHandler() {
    companion object {
        private const val IN_FLIGHT_INSTANCE_ATTR = "arthas.inFlightInstances"
        private const val SEND_LOCK_ATTR = "arthas.sendLock"
    }

    private val logger = LoggerFactory.getLogger(ArthasChannelResultWebSocketHandler::class.java)

    override fun afterConnectionEstablished(session: WebSocketSession) {
        session.attributes[IN_FLIGHT_INSTANCE_ATTR] = ConcurrentHashMap.newKeySet<String>()
        session.attributes[SEND_LOCK_ATTR] = Any()
    }

    override fun handleTextMessage(
        session: WebSocketSession,
        message: TextMessage,
    ) {
        val payload = parsePullRequest(message.payload)
        if (payload.type != "pull_results") {
            return
        }
        val channelId = session.attributes[ArthasResultWebSocketHandshakeInterceptor.CHANNEL_ID_ATTR] as? String ?: return
        val httpSession = session.attributes[ArthasResultWebSocketHandshakeInterceptor.HTTP_SESSION_ATTR] as? HttpSession ?: return
        val allInstanceIds = arthasPullResultCoordinator.resolveTargetInstanceIds(channelId)
        val acceptedInstanceIds = allInstanceIds.filter { acquireInFlight(session, it) }
        val context = session.attributes[ArthasResultWebSocketHandshakeInterceptor.SECURITY_CONTEXT] as SecurityContext
        for (instanceId in acceptedInstanceIds) {
            executor.execute {
                SecurityContextHolder.setContext(context)
                try {
                    handlePullRequest(session, httpSession, instanceId)
                } finally {
                    SecurityContextHolder.clearContext()
                }
            }
        }
    }

    override fun afterConnectionClosed(
        session: WebSocketSession,
        status: CloseStatus,
    ) {
        clearInFlight(session)
    }

    override fun handleTransportError(
        session: WebSocketSession,
        exception: Throwable,
    ) {
        logger.warn("Arthas websocket transport error: {}", exception.message, exception)
        clearInFlight(session)
    }

    private fun handlePullRequest(
        session: WebSocketSession,
        httpSession: HttpSession,
        instanceId: String,
    ) {
        try {
            val messages = arthasPullResultCoordinator.pullResults(httpSession, instanceId)
            if (messages.isEmpty) {
                return
            }
            sendJson(session, PullResultWebSocketEvent(instanceId = instanceId, messages = messages))
        } catch (e: Exception) {
            val messages = arthasPullResultCoordinator.errorResult(e)
            sendJson(session, PullResultWebSocketEvent(instanceId = instanceId, messages = messages))
        } finally {
            releaseInFlight(session, instanceId)
        }
    }

    private fun acquireInFlight(
        session: WebSocketSession,
        instanceId: String,
    ): Boolean = inFlightInstances(session).add(instanceId)

    private fun releaseInFlight(
        session: WebSocketSession,
        instanceId: String,
    ) {
        inFlightInstances(session).remove(instanceId)
    }

    private fun clearInFlight(session: WebSocketSession) {
        inFlightInstances(session).clear()
    }

    @Suppress("UNCHECKED_CAST")
    private fun inFlightInstances(session: WebSocketSession): MutableSet<String> =
        session.attributes[IN_FLIGHT_INSTANCE_ATTR] as? MutableSet<String>
            ?: ConcurrentHashMap.newKeySet<String>().also {
                session.attributes[IN_FLIGHT_INSTANCE_ATTR] = it
            }

    private fun sendJson(
        session: WebSocketSession,
        payload: Any,
    ) {
        if (!session.isOpen) {
            return
        }
        val lock = session.attributes[SEND_LOCK_ATTR] ?: session
        synchronized(lock) {
            if (!session.isOpen) {
                return
            }
            session.sendMessage(TextMessage(payload.toJsonString()))
        }
    }

    private fun parsePullRequest(payload: String): PullResultsWebSocketRequest {
        val node = GLOBAL_JSON_MAPPER.readTree(payload)
        return PullResultsWebSocketRequest(
            type = node.path("type").stringValue() ?: "",
        )
    }
}
