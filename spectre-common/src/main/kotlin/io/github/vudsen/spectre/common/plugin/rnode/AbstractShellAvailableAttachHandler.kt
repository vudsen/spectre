package io.github.vudsen.spectre.common.plugin.rnode

import io.github.vudsen.spectre.common.LocalPackageManager
import io.github.vudsen.spectre.common.progress.ProgressReportHolder
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.dto.ToolchainItemDTO
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmAttachHandler
import org.slf4j.LoggerFactory

abstract class AbstractShellAvailableAttachHandler<T : ShellAvailableRuntimeNode>(
    protected val runtimeNode: T,
    protected val jvm: Jvm,
    protected val bundles: ToolchainBundleDTO
) : JvmAttachHandler {

    companion object {
        private val logger = LoggerFactory.getLogger(AbstractShellAvailableAttachHandler::class.java)
    }

    /**
     * @param paths 目标宿主机/容器上的工具链路径
     * @see [attach]
     */
    protected abstract fun doAttach(port: Int?, paths: ToolchainPaths): ArthasHttpClient

    /**
     * 在 attach 之前进行一些初始化操作
     */
    protected open fun beforeAttach() {}

    protected open fun afterAttachFinished() {}

    private fun attachInternal(port: Int?): ArthasHttpClient {
        val local = resolveSpectreHome()
        val downloadDirectory = "$local/downloads"
        runtimeNode.mkdirs(downloadDirectory)

        val paths = ToolchainPaths(
            prepareJattach(downloadDirectory, local),
            prepareArthas(downloadDirectory, local),
            prepareHttpClient(downloadDirectory, local),
        )
        val client = doAttach(port, paths)
        try {
            // TODO handle port in use.
            client.test()
            return client
        } catch (e: Exception) {
            if (port == null) {
                val client = tryFindClient(paths) ?: throw e
                return client
            }
            logger.error("", e)
            throw e
        }
    }

    override fun attach(port: Int?): ArthasHttpClient {
        beforeAttach()
        try {
            return attachInternal(port)
        } finally {
            afterAttachFinished()
        }
    }


    /**
     * 主动 attach 失败时(jattach 加载 jar 包成功，但是端口实际未绑定，此时说明 jvm 已经被 attach 了)，尝试寻找已经绑定的端口.
     *
     * 对于容器环境，可以尝试每次都绑定固定的端口
     */
    protected abstract fun tryFindClient(paths: ToolchainPaths): ArthasHttpClient?

    private fun prepareBundle(baseDirectory: String, item: ToolchainItemDTO): String {
        val armUrl = item.armUrl
        var isArm: Boolean
        var downloadUrl: String

        if (!armUrl.isNullOrEmpty() && runtimeNode.isArm()) {
            isArm = true
            downloadUrl = armUrl
        } else {
            isArm = false
            downloadUrl = item.url
        }
        val path = LocalPackageManager.resolvePackage(item.type, item.tag, isArm, downloadUrl)
        val dest = "$baseDirectory/$isArm"
        ProgressReportHolder.currentProgressManager()?.pushState("上传${item.type.originalName}到目标节点")
        try {
            runtimeNode.upload(path, dest)
        } finally {
            ProgressReportHolder.currentProgressManager()?.popState()
        }
        return dest
    }

    /**
     * 获取家目录
     */
    protected abstract fun resolveSpectreHome(): String

    protected fun prepareHttpClient(
        downloadDirectory: String,
        spectreHome: String
    ): String {
        val httpClientJar = prepareBundle(downloadDirectory, bundles.httpClient)
        val finalPath = "$spectreHome/packages/http-client/http-client-${bundles.httpClient.tag}.jar"
        runtimeNode.mkdirs("$spectreHome/packages/http-client/")
        runtimeNode.execute("cp $httpClientJar $finalPath").ok()
        return finalPath
    }

    protected fun prepareArthas(
        downloadDirectory: String,
        spectreHome: String
    ): String {
        val arthasBundle = prepareBundle(downloadDirectory, bundles.arthas)
        val packageDirectory = "$spectreHome/packages/arthas/${bundles.arthas.tag}"
        runtimeNode.mkdirs(packageDirectory)
        runtimeNode.execute("tar -zxvf $arthasBundle -C $packageDirectory").ok()
        return packageDirectory
    }

    protected fun prepareJattach(
        downloadDirectory: String,
        spectreHome: String
    ): String {
        val jattachBundle = prepareBundle(downloadDirectory, bundles.jattach)
        val packageDirectory = "$spectreHome/packages/jattach/${bundles.jattach.tag}"
        runtimeNode.mkdirs(packageDirectory)
        runtimeNode.execute("tar -xvf $jattachBundle -C $packageDirectory").ok()
        return "$packageDirectory/jattach"
    }


}