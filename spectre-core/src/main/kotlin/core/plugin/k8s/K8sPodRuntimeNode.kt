package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import io.github.vudsen.spectre.api.entity.OS
import io.github.vudsen.spectre.api.entity.currentOS
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.common.plugin.rnode.AbstractShellRuntimeNode
import okhttp3.WebSocket
import okio.ByteString
import org.apache.commons.compress.archivers.tar.TarArchiveEntry
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.io.Writer
import kotlin.io.path.Path

/**
 * 具体到 Pod 的运行节点
 */
class K8sPodRuntimeNode(
    private val ctx: K8sExecContext,
    private val conf: K8sRuntimeNodeConfig,
    extension: RuntimeNodeExtensionPoint
) : AbstractShellRuntimeNode(extension) {

    override fun doUpload(input: InputStream, dest: String) {
        val destPath = Path(dest)
        // 1. 优化父路径处理逻辑
        val parentPath = destPath.parent?.let {
            if (currentOS == OS.WINDOWS) it.toString().replace('\\', '/') else it.toString()
        } ?: "."

        createInteractiveShell(listOf("sh", "-c", "tar -xmf - -C $parentPath")).use { shell ->
            TarArchiveOutputStream(shell.getOutputStream()).use { archiveOutputStream ->
                archiveOutputStream.setLongFileMode(TarArchiveOutputStream.LONGFILE_ERROR)
                archiveOutputStream.setBigNumberMode(TarArchiveOutputStream.BIGNUMBER_ERROR)
                archiveOutputStream.setAddPaxHeadersForNonAsciiNames(true)

                // 2. 使用传入的 input 流
                input.use { inputStream ->
                    // 注意：filename 建议使用 destPath.fileName.toString() 保持逻辑一致
                    val entryName = destPath.fileName.toString()
                    val entry = TarArchiveEntry(entryName)

                    // 3. 关键点：设置文件大小
                    // 如果能预先知道大小，请传入；如果不知道，InputStream 需要先转为 ByteArray 或临时文件
                    // 这里假设你可能需要处理未知大小的流，详见下方说明
                    val bytes = inputStream.readAllBytes()
                    entry.size = bytes.size.toLong()

                    entry.setModTime(System.currentTimeMillis())
                    archiveOutputStream.putArchiveEntry(entry)

                    // 4. 写入数据
                    archiveOutputStream.write(bytes)

                    archiveOutputStream.closeArchiveEntry()
                }
            }
            shell.client.waitClose()
        }
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

        override fun close() {
            ws.send(ByteString.of(255.toByte(), 0))
        }

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
            outputStream.close()
            writer.close()
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