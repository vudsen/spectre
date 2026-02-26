package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import io.github.vudsen.spectre.api.entity.OS
import io.github.vudsen.spectre.api.entity.currentOS
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.common.plugin.rnode.AbstractShellRuntimeNode
import okhttp3.WebSocket
import org.apache.commons.compress.archivers.tar.TarArchiveEntry
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.io.Writer
import kotlin.io.path.Path
import kotlin.math.min

/**
 * 具体到 Pod 的运行节点
 */
class K8sPodRuntimeNode(
    private val ctx: K8sExecContext,
    private val conf: K8sRuntimeNodeConfig,
    extension: RuntimeNodeExtensionPoint
) : AbstractShellRuntimeNode(extension) {

    companion object {
        /**
         * 12 MB
         */
        private const val MAX_SINGLE_UPDATE_SIZE = 1024 * 1024 * 12L
    }

    override fun upload(source: BoundedInputStreamSource, dest: String) {
        return doUpload(source, dest)
    }

    override fun doUpload(source: BoundedInputStreamSource, dest: String) {
        if (source.size() > MAX_SINGLE_UPDATE_SIZE) {
            doUploadInChunks(source, dest)
            return
        }

        val destPath = Path(dest)
        // 1. 优化父路径处理逻辑
        val parentPath = destPath.parent?.let {
            if (currentOS == OS.WINDOWS) it.toString().replace('\\', '/') else it.toString()
        } ?: "."

        var written: Long = 0

        createInteractiveShell(listOf("sh", "-c", "tar -xmf - -C $parentPath")).use { shell ->
            TarArchiveOutputStream(shell.getOutputStream()).use { archiveOutputStream ->
                source.inputStream.use { inputStream ->
                    val entryName = destPath.fileName.toString()
                    val entry = TarArchiveEntry(entryName)

                    val size = source.size()
                    entry.size = size

                    archiveOutputStream.putArchiveEntry(entry)

                    val buffer = ByteArray(64 * 1024) // 64KB
                    var read: Int

                    while (inputStream.read(buffer).also { read = it } != -1) {
                        archiveOutputStream.write(buffer, 0, read)
                        written += read
                    }
                    if (written != size) {
                        throw IllegalStateException("Tar entry size mismatch: expected=$size, written=$written")
                    }
                    archiveOutputStream.closeArchiveEntry()
                }
            }
            shell.client.waitClose()
                .ok()
        }

    }

    /**
     * 文件超过 16MB 就会丢数据. 需要对文件进行分片
     */
    private fun doUploadInChunks(source: BoundedInputStreamSource, dest: String) {
        val destPath = Path(dest)
        // 1. 优化父路径处理逻辑
        val parentPath = destPath.parent?.let {
            if (currentOS == OS.WINDOWS) it.toString().replace('\\', '/') else it.toString()
        } ?: "."

        var remaining: Long = source.size()
        var chunkCount = 0

        source.inputStream.use { inputStream ->
            while (remaining > 0) {
                createInteractiveShell(listOf("sh", "-c", "tar -xmf - -C $parentPath")).use { shell ->
                    TarArchiveOutputStream(shell.getOutputStream()).use { archiveOutputStream ->
                            val entryName = destPath.fileName.toString()
                            val entry = TarArchiveEntry("${entryName}_${chunkCount}.chunk")

                            val currentSize = min(remaining, MAX_SINGLE_UPDATE_SIZE)
                            val size = currentSize
                            entry.size = size

                            archiveOutputStream.putArchiveEntry(entry)

                            val buffer = ByteArray(64 * 1024) // 64KB
                            var currentRemaining = currentSize.toInt()

                            while (true) {
                                val len = inputStream.read(buffer, 0, min(buffer.size, currentRemaining))
                                archiveOutputStream.write(buffer, 0, len)
                                currentRemaining -= len
                                remaining -= len
                                if (currentRemaining <= 0) {
                                    break
                                }
                            }
                            archiveOutputStream.closeArchiveEntry()
                        }
                    shell.client.waitClose()
                        .ok()
                }
                chunkCount++
            }
        }
        execute(listOf("sh", "-c", "cat $parentPath/*.chunk > ${dest}")).ok()
        execute(listOf("rm", "-f", "*.chunk")).ok()
    }

    override fun execute(vararg commands: String): CommandExecuteResult {
        return execute(listOf(*commands))
    }

    fun execute(commands: List<String>): CommandExecuteResult {
        val client = K8sExecClient(
            conf.apiServerEndpoint,
            commands,
            ctx.namespace,
            ctx.podName,
            ctx.container,
            false,
            conf.token
        )
        client.insecure = conf.insecure
        return client.exec()
    }

    override fun execute(command: String): CommandExecuteResult {
        return execute(command.split(' '))
    }


    fun createInteractiveShell(commands: List<String>): K8sInteractiveShell {
        val client = K8sExecClient(
            conf.apiServerEndpoint,
            commands,
            ctx.namespace,
            ctx.podName,
            ctx.container,
            true,
            conf.token
        )
        client.insecure = conf.insecure
        val ws = client.execWithStdinOpen()
        return K8sInteractiveShell(client, ws)
    }

    private class WebSocketWriter(private val ws: WebSocket): Writer() {
        override fun write(cbuf: CharArray, off: Int, len: Int) {
            ws.send(String(cbuf, off, len))
        }

        override fun flush() {}

        override fun close() {}

    }

    class K8sInteractiveShell(val client: K8sExecClient, val ws: WebSocket) : InteractiveShell {
        private val outputStream: K8sWebSocketOutputStream by lazy {  K8sWebSocketOutputStream(ws) }

        private val writer: WebSocketWriter by lazy { WebSocketWriter(ws) }

        override fun getInputStream(): InputStream {
            return client.inputStream
        }

        override fun getWriter(): Writer {
            return writer
        }

        override fun getOutputStream(): OutputStream {
            return outputStream
        }

        override fun isAlive(): Boolean {
            return client.isAlive()
        }

        override fun exitCode(): Int {
            return 0
        }

        override fun close() {
            outputStream.flush()
            outputStream.close()
            writer.close()
            ws.close(1000, null)
        }
    }

    override fun createInteractiveShell(command: String): InteractiveShell {
        return createInteractiveShell(command.split(' '))
    }

    override fun getHomePath(): String {
        return conf.spectreHome
    }

    override fun ensureAttachEnvironmentReady() {}

    override fun getConfiguration(): RuntimeNodeConfig {
        return conf
    }

}