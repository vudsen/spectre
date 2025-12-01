package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.plugin.rnode.JvmAttachHandler
import io.github.vudsen.spectre.common.plugin.rnode.TypedRuntimeNodeExtensionPoint
import io.github.vudsen.spectre.core.plugin.k8s.entity.K8sPod
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearcher
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.common.plugin.rnode.SearchTreeBuilder
import org.springframework.stereotype.Component
import java.util.WeakHashMap

@Component
class K8sRuntimeNodeExtension : TypedRuntimeNodeExtensionPoint<K8sRuntimeNodeConfig, K8sRuntimeNode>("Kubernetes") {

    private val searcher: JvmSearcher by lazy {
        val builder = SearchTreeBuilder.create()

        val namespaceNode = builder.addHandler { runtimeNode, searchNode ->
            runtimeNode as K8sRuntimeNode
            return@addHandler runtimeNode.listNamespaces().map { namespace ->
                JvmSearchNode(namespace, false, null)
            }
        }

        val podNode = namespaceNode.addHandler { runtimeNode, searchNode ->
            runtimeNode as K8sRuntimeNode
            return@addHandler runtimeNode.listPods(searchNode.name).map { pod ->
                JvmSearchNode("${pod.metadata.name} (Pod) (${pod.status.phase})", true, pod)
            }
        }

        podNode.addHandler<PodWithSpecificContainer> { runtimeNodeCache, searchNode ->
            val pod = searchNode.ctx ?: return@addHandler emptyList()
            return@addHandler pod.spec.containers.mapIndexed { index, container ->
                JvmSearchNode(
                    "${container.name}(${container.image})",
                    true,
                    PodWithSpecificContainer().apply {
                        this@apply.index = index
                        this@apply.pod = pod
                    }
                )
            }
        }

        builder.build { searchNode ->
            val ctx = searchNode.ctx ?: throw AppException("Failed to deserialize jvm from searchNode: $searchNode")

            if (ctx is PodWithSpecificContainer) {
                return@build K8sContainerJvm(
                    ctx.pod.metadata.name,
                    ctx.pod.metadata.name,
                    ctx.pod.metadata.namespace,
                    ctx.pod.spec.containers[ctx.index].name
                )
            } else if (ctx is K8sPod) {
                return@build K8sContainerJvm(
                    ctx.metadata.name,
                    ctx.metadata.name,
                    ctx.metadata.namespace,
                    ctx.spec.containers[0].name
                )
            }
            throw AppException("Failed to deserialize jvm from ctx: $ctx")
        }
    }

    private class PodWithSpecificContainer {
        var index: Int = 0

        lateinit var pod: K8sPod
    }

    private val runtimeNodeCache = WeakHashMap<RuntimeNodeConfig, K8sRuntimeNode>()

    override fun getConfigurationClass(): Class<K8sRuntimeNodeConfig> {
        return K8sRuntimeNodeConfig::class.java
    }

    override fun getConfigurationForm0(oldConfiguration: K8sRuntimeNodeConfig?): PageDescriptor {
        return PageDescriptor("form/K8sConfForm", oldConfiguration, "")
    }

    override fun createRuntimeNode0(config: K8sRuntimeNodeConfig): K8sRuntimeNode {
        val cached = runtimeNodeCache[config]
        if (cached == null) {
            val newOne = K8sRuntimeNode(config)
            runtimeNodeCache[config] = cached
            return newOne
        }
        return cached
    }

    override fun test0(conf: K8sRuntimeNodeConfig) {
        createRuntimeNode0(conf).ensureAttachEnvironmentReady()
    }

    override fun filterSensitiveConfiguration0(conf: K8sRuntimeNodeConfig) {
        conf.token = ""
    }

    override fun fillSensitiveConfiguration0(
        updated: K8sRuntimeNodeConfig,
        base: K8sRuntimeNodeConfig
    ): RuntimeNodeConfig {
        if (updated.token.isEmpty()) {
            updated.token = base.token
        }
        return updated
    }

    override fun createAttachHandler0(
        runtimeNode: K8sRuntimeNode,
        jvm: Jvm,
        bundles: ToolchainBundleDTO
    ): JvmAttachHandler {
        return K8sAttachHandler(runtimeNode, jvm, bundles)
    }

    override fun getDescription(): String {
        return """
            通过 HTTP API 连接到 K8s 集群，访问并管理集群中的 Jvm Pod。
        """.trimIndent()
    }

    override fun isCloseableRuntimeNode(): Boolean {
        return false
    }

    override fun createSearcher(): JvmSearcher {
        return searcher
    }

    override fun getId(): String {
        return "RuntimeNodeExtensionPoint:K8sRuntimeNodeExtension"
    }
}