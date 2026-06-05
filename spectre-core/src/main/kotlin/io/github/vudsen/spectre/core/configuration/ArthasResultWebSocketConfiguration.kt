package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.core.controller.ws.ArthasChannelResultWebSocketHandler
import io.github.vudsen.spectre.core.controller.ws.ArthasResultWebSocketHandshakeInterceptor
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry

@Configuration
@EnableWebSocket
class ArthasResultWebSocketConfiguration(
    private val arthasChannelResultWebSocketHandler: ArthasChannelResultWebSocketHandler,
    private val arthasResultWebSocketHandshakeInterceptor: ArthasResultWebSocketHandshakeInterceptor,
) : WebSocketConfigurer {
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry
            .addHandler(arthasChannelResultWebSocketHandler, "/arthas/channel/results-ws")
            .addInterceptors(arthasResultWebSocketHandshakeInterceptor)
            .setAllowedOriginPatterns("*")
    }
}
