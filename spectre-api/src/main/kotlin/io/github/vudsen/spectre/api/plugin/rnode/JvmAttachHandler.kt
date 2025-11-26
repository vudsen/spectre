package io.github.vudsen.spectre.api.plugin.rnode

import org.springframework.boot.web.server.PortInUseException


interface JvmAttachHandler {

    /**
     * 连接到 arthas
     * @param port 要绑定到哪个端口, 如果不提供，则由 handler 自己指定
     */
    @Throws(PortInUseException::class)
    fun attach(port: Int?): ArthasHttpClient


}