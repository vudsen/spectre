package io.github.vudsen.spectre.common.plugin.rnode

import io.github.vudsen.spectre.common.LocalPackageManager
import io.github.vudsen.spectre.common.progress.ProgressReportHolder
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.dto.ToolchainItemDTO
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmAttachHandler
import io.github.vudsen.spectre.common.ApplicationContextHolder
import org.slf4j.LoggerFactory
import org.springframework.cglib.core.Local

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
    protected abstract fun doAttach(port: Int?, password: String, paths: ToolchainPaths): ArthasHttpClient

    private fun attachInternal(port: Int?, password: String): ArthasHttpClient {
        val local = runtimeNode.getHomePath()
        val downloadDirectory = "$local/downloads"
        runtimeNode.mkdirs(downloadDirectory)

        val paths = ToolchainPaths(
            prepareJattach(downloadDirectory, local),
            prepareArthas(downloadDirectory, local),
            prepareHttpClient(downloadDirectory, local),
        )
        val client = doAttach(port, password, paths)
        try {
            // TODO handle port in use.
            client.test()
            return client
        } catch (e: Exception) {
            if (port == null) {
                val client = tryFindClient(password, paths) ?: throw e
                return client
            }
            logger.error("", e)
            throw e
        }
    }

    override fun attach(port: Int?, password: String): ArthasHttpClient {
        return attachInternal(port, password)
    }


    /**
     * 主动 attach 失败时(jattach 加载 jar 包成功，但是端口实际未绑定，此时说明 jvm 已经被 attach 了)，尝试寻找已经绑定的端口.
     *
     * 对于容器环境，可以尝试每次都绑定固定的端口
     */
    protected abstract fun tryFindClient(password: String, paths: ToolchainPaths): ArthasHttpClient?

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
        val file = LocalPackageManager.resolvePackage(item.type, item.tag, isArm, downloadUrl)

        val dest = "$baseDirectory/${file.name}"
        ProgressReportHolder.currentProgressManager()?.pushState("上传${item.type.originalName}到目标节点")
        try {
            runtimeNode.upload(file.absolutePath, dest)
        } finally {
            ProgressReportHolder.currentProgressManager()?.popState()
        }
        return dest
    }

    protected fun prepareHttpClient(
        downloadDirectory: String,
        spectreHome: String
    ): String {
        val httpClient = LocalPackageManager.resolveBundledHttpClient()

        ProgressReportHolder.currentProgressManager()?.pushState("上传 http-client 到目标节点")
        val appVersion = ApplicationContextHolder.getAppVersion()
        val dest = "$downloadDirectory/http-client-$appVersion.jar"
        try {
            runtimeNode.upload(httpClient, dest)
        } finally {
            ProgressReportHolder.currentProgressManager()?.popState()
        }

        val finalPath = "$spectreHome/packages/http-client/http-client-$appVersion.jar"
        runtimeNode.mkdirs("$spectreHome/packages/http-client/")
        runtimeNode.execute("cp $dest $finalPath").ok()
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