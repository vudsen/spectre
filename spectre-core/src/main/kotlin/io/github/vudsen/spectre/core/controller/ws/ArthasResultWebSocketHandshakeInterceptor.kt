package io.github.vudsen.spectre.core.controller.ws

import org.springframework.http.server.ServerHttpRequest
import org.springframework.http.server.ServerHttpResponse
import org.springframework.http.server.ServletServerHttpRequest
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.socket.WebSocketHandler
import org.springframework.web.socket.server.HandshakeInterceptor

@Component
class ArthasResultWebSocketHandshakeInterceptor : HandshakeInterceptor {
    companion object {
        const val HTTP_SESSION_ATTR = "arthas.httpSession"
        const val CHANNEL_ID_ATTR = "arthas.channelId"
        const val SECURITY_CONTEXT = "arthas.securityContext"
    }

    override fun beforeHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        attributes: MutableMap<String, Any>,
    ): Boolean {
        val servletRequest = (request as? ServletServerHttpRequest)?.servletRequest ?: return false
        val httpSession = servletRequest.getSession(false) ?: return false
        val channelId = servletRequest.getParameter("channelId")?.takeIf { it.isNotBlank() } ?: return false
        attributes[HTTP_SESSION_ATTR] = httpSession
        attributes[CHANNEL_ID_ATTR] = channelId
        attributes[SECURITY_CONTEXT] = SecurityContextHolder.getContext()
        return true
    }

    override fun afterHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        exception: Exception?,
    ) {
    }
}
