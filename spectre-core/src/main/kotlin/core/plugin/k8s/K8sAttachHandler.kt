package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.common.plugin.rnode.ToolchainPaths
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.common.plugin.rnode.AbstractShellAvailableAttachHandler
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.api.plugin.rnode.Jvm

class K8sAttachHandler(
    runtimeNode: K8sRuntimeNode,
    jvm: Jvm,
    bundles: ToolchainBundleDTO
) : AbstractShellAvailableAttachHandler<K8sRuntimeNode>(runtimeNode, jvm, bundles) {

    companion object {
        private const val KUBERNETES_LISTEN_PORT = 37556
    }

    private val execContext: K8sExecContext

    init {
        jvm as K8sContainerJvm
        execContext = K8sExecContext(
            jvm.namespace ?: "default",
            jvm.id,
            jvm.containerName
        )
    }

    override fun doAttach(
        port: Int?,
        paths: ToolchainPaths
    ): ArthasHttpClient {
        if (jvm !is K8sContainerJvm) {
            throw AppException("Unsupported jvm: $jvm, class: ${jvm::class.java}")
        }
        return attach0(paths, port)
    }

    override fun beforeAttach() {
        K8sRuntimeNode.execContextHolder.set(execContext)
    }

    override fun afterAttachFinished() {
        K8sRuntimeNode.execContextHolder.remove()
    }

    private fun attach0(paths: ToolchainPaths, port: Int?): ArthasHttpClient {
        if (port == null) {
            // TODO 支持切换 pid
            runtimeNode.execute(paths.jattachPath, "1", "load", "instrument", "false", "${paths.arthasHome}/arthas-agent.jar=;httpPort=${KUBERNETES_LISTEN_PORT};telnetPort=-1;").ok()
        }
        return K8sArthasHttpClient(
            runtimeNode,
            paths.httpClientPath,
            "http://127.0.0.1:${KUBERNETES_LISTEN_PORT}/api",
            "java",
            execContext
        )
    }


    override fun tryFindClient(paths: ToolchainPaths): ArthasHttpClient? {
        if (jvm !is K8sContainerJvm) {
            return null
        }
        return attach0(paths, KUBERNETES_LISTEN_PORT)
    }


}