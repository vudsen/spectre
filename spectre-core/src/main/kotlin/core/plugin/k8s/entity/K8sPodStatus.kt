package io.github.vudsen.spectre.core.plugin.k8s.entity

/**
 * [PodStatus](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/workload-resources/pod-v1/#PodStatus)
 */
data class K8sPodStatus(
    var phase: String = "",

    var message: String = ""
)