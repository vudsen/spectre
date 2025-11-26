package io.github.vudsen.spectre.core.plugin.k8s

import com.fasterxml.jackson.databind.JsonNode
import io.github.vudsen.spectre.common.plugin.rnode.ShellBasedArthasHttpClient
import io.github.vudsen.spectre.common.plugin.rnode.ShellAvailableRuntimeNode

class K8sArthasHttpClient(
    runtimeNode: ShellAvailableRuntimeNode,
    clientPath: String,
    arthasHttpEndpoint: String,
    javaPath: String,
    private val context: K8sExecContext
) : ShellBasedArthasHttpClient(runtimeNode, clientPath, arthasHttpEndpoint, javaPath) {


    override fun sendRequest(body: Any, noCheckResponse: Boolean): JsonNode {
        K8sRuntimeNode.execContextHolder.set(context)
        try {
            return super.sendRequest(body, noCheckResponse)
        } finally {
            K8sRuntimeNode.execContextHolder.remove()
        }
    }


}