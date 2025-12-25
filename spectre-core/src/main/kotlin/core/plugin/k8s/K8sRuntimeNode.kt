package io.github.vudsen.spectre.core.plugin.k8s

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.common.plugin.rnode.AbstractShellRuntimeNode
import io.github.vudsen.spectre.core.plugin.k8s.entity.K8sPod
import io.github.vudsen.spectre.core.util.InsecureRequestFactory
import io.github.vudsen.spectre.api.entity.OS
import io.github.vudsen.spectre.api.entity.currentOS
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import okhttp3.WebSocket
import okio.ByteString
import org.apache.commons.compress.archivers.tar.TarArchiveEntry
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.RestClient
import java.io.*
import java.nio.file.Path
import kotlin.io.path.Path

class K8sRuntimeNode(private val conf: K8sRuntimeNodeConfig) : AbstractShellRuntimeNode() {

    companion object {
        private val objectMapper: ObjectMapper

        private val ignoredNamespaces = setOf("kube-public", "kube-system")

        /**
         * 执行命令时必要的上下文. 若为空，则调用 [execute] 和 [createInteractiveShell] 时会报错
         */
        val execContextHolder = ThreadLocal<K8sExecContext>()

        init {
            val objectMapper = ObjectMapper()
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            this.objectMapper = objectMapper
        }
    }

    private val restClient: RestClient

    init {
        val builder = RestClient.builder()
            .defaultHeader("Authorization", "Bearer ${conf.token}")
            .baseUrl(conf.apiServerEndpoint)
        if (conf.insecure) {
            builder.requestFactory(InsecureRequestFactory)
        }
        restClient = builder.build()
    }

    /**
     * See [pod](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/workload-resources/pod-v1/#list-%E5%88%97%E5%87%BA%E6%88%96%E8%A7%82%E5%AF%9F-pod-%E7%A7%8D%E7%B1%BB%E7%9A%84%E5%AF%B9%E8%B1%A1)
     */
    fun listPods(namespace: String): List<K8sPod> {
        val body = doRequest(restClient.get().uri("/api/v1/namespaces/${namespace}/pods").retrieve(), "namespaces/list") ?: return emptyList()
        val root = objectMapper.readTree(body)

        val items = root.get("items") ?: return emptyList()
        return objectMapper.treeToValue(items, K8sPodTypeReference)
    }

    private object K8sPodTypeReference : TypeReference<List<K8sPod>>()

    /**
     * 列出所有命名空间
     *
     * See [namespace](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/cluster-resources/namespace-v1/#list-%E5%88%97%E5%87%BA%E6%88%96%E8%80%85%E6%A3%80%E6%9F%A5%E7%B1%BB%E5%88%AB%E4%B8%BA-namespace-%E7%9A%84%E5%AF%B9%E8%B1%A1)
     */
    fun listNamespaces(): List<String> {
        val body = doRequest(
            restClient.get()
                .uri("/api/v1/namespaces")
                .retrieve()
        , "namespaces") ?: return emptyList()

        val root = objectMapper.readTree(body)

        val items = root.get("items") ?: return emptyList()
        return items.map { node -> node.get("metadata").get("name").asText() }.filter { s -> !ignoredNamespaces.contains(s) }
    }

    private fun doRequest(spec: RestClient.ResponseSpec, permission: String): String? {
        try {
            return spec.body(String::class.java)
        } catch (_: HttpClientErrorException.Forbidden) {
            throw BusinessException("权限不足，请确认您已为服务账号分配 `$permission` 权限")
        }
    }

    private fun uploadTgzFile(src: File, parentPath: String) {
        createInteractiveShell(listOf("sh", "-c", "tar -xzmf - -C $parentPath")).use { shell ->
            shell.getOutputStream().use { outputStream ->
                FileInputStream(src).use { inputStream ->
                    inputStream.transferTo(outputStream)
                }
            }
            shell.client.waitClose()
        }
    }


    fun execute(commands: List<String>): CommandExecuteResult {
        val ctx = execContextHolder.get() ?: throw AppException("Exec context is null!")
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
        val ctx = execContextHolder.get() ?: throw AppException("Exec context is null!")
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

        override fun exitCode(): Int? {
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

    private class WebSocketWriter(private val ws: WebSocket): Writer() {
        override fun write(cbuf: CharArray, off: Int, len: Int) {
            ws.send(String(cbuf, off, len))
        }

        override fun flush() {}

        override fun close() {
            ws.send(ByteString.of(255.toByte(), 0))
        }

    }

    override fun ensureAttachEnvironmentReady() {
        try {
            doRequest(
                restClient.post()
                    .uri("/apis/authentication.k8s.io/v1/tokenreviews")
                    .body("""{ "apiVersion": "authentication.k8s.io/v1", "kind": "TokenReview", "spec": { "token": "${conf.token}" } }""")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
            , "tokenreviews")
        } catch (e: Exception) {
            throw BusinessException("测试失败: ${e.message}")
        }
        // TODO 校验权限和用户名
    }

    override fun getConfiguration(): K8sRuntimeNodeConfig {
        return conf
    }

    override fun doUpload(input: InputStream, filename: String, dest: String) {
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
}