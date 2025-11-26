package io.github.vudsen.spectre.core.plugin.k8s

import okhttp3.WebSocket
import okio.ByteString
import java.io.IOException
import java.io.OutputStream

class K8sWebSocketOutputStream(private val ws: WebSocket) : OutputStream() {

    override fun close() {
        ws.send(ByteString.of(255.toByte(), 0))
    }

    override fun write(b: ByteArray) {
        write(b, 0, b.size)
    }

    override fun write(b: Int) {
        write(byteArrayOf(b.toByte()), 0, 1)
    }

    override fun write(b: ByteArray, off: Int, len: Int) {
        // 第一个位表示标准输入
        val data = ByteArray(len + 1)
        b.copyInto(data, 1, off, off + len)


        ws.send(ByteString.of(*data))
    }

    override fun flush() {
        var i = 0

        while (ws.queueSize() > 0L) {
            try {
                Thread.sleep(100L)
            } catch (_: InterruptedException) { }

            if (i++ > 100) {
                throw IOException("Timed out waiting for web-socket to flush.")
            }
        }
    }
}