package io.github.vudsen.spectre.core.plugin.k8s.entity

/**
 * [PodStatus](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/workload-resources/pod-v1/#PodStatus)
 */
class K8sPodStatus {

    lateinit var phase: String

    var message: String? = null

}