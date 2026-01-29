package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.common.plugin.rnode.ToolchainPaths
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.common.plugin.rnode.AbstractShellAvailableAttachHandler
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.common.plugin.rnode.ShellBasedArthasHttpClient

class K8sAttachHandler(
    runtimeNode: K8sRuntimeNode,
    jvm: K8sContainerJvm,
    bundles: ToolchainBundleDTO
) : AbstractShellAvailableAttachHandler<K8sPodRuntimeNode>(
    K8sPodRuntimeNode(
        K8sExecContext(
            jvm.namespace ?: "default",
            jvm.id,
            jvm.containerName
        ),
        runtimeNode.getConfiguration(),
        runtimeNode.getExtPoint()
    ),
    jvm,
    bundles
) {

    companion object {
        private const val KUBERNETES_LISTEN_PORT = 37556
    }



    override fun doAttach(
        port: Int?,
        password: String,
        paths: ToolchainPaths
    ): ArthasHttpClient {
        if (jvm !is K8sContainerJvm) {
            throw AppException("Unsupported jvm: $jvm, class: ${jvm::class.java}")
        }
        return attach0(paths, password, port)
    }


    private fun attach0(paths: ToolchainPaths, password: String, port: Int?): ArthasHttpClient {
        if (port == null) {
            // TODO 支持切换 pid
            runtimeNode.execute(
                paths.jattachPath,
                "1",
                "load",
                "instrument",
                "false",
                "${paths.arthasHome}/arthas-agent.jar=;password=${password};httpPort=${KUBERNETES_LISTEN_PORT};telnetPort=-1;"
            ).ok()
        }
        return ShellBasedArthasHttpClient(
            runtimeNode,
            paths.httpClientPath,
            "http://127.0.0.1:${KUBERNETES_LISTEN_PORT}/api",
            "java",
            password
        )
    }


    override fun tryFindClient(password: String, paths: ToolchainPaths): ArthasHttpClient? {
        if (jvm !is K8sContainerJvm) {
            return null
        }
        return attach0(paths, password, KUBERNETES_LISTEN_PORT)
    }


}