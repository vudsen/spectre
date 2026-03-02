package io.github.vudsen.spectre.core.plugin.k8s.entity

/**
 * [PodSpec](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/workload-resources/pod-v1/#PodSpec)
 */
data class K8sPodSpec(var containers: List<K8sContainer> = emptyList()) {

    data class K8sContainer(
        var name: String = "",
        var image: String = ""
    )

}