package io.github.vudsen.spectre.api.plugin.rnode

import org.springframework.boot.web.server.PortInUseException


interface JvmAttachHandler {

    /**
     * 连接到 arthas
     * @param port 要绑定到哪个端口 当该值非空时，说明 arthas 先前已经 attach 上了，实现类应该先尝试连接对应的端口即可。
     *             如果使用该端口没连上，或者该参数为空，则需要实现类自己指定端口
     */
    @Throws(PortInUseException::class)
    fun attach(port: Int?, password: String): ArthasHttpClient


}