package io.github.vudsen.spectre.core.plugin.k8s.entity

/**
 * [PodSpec](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/workload-resources/pod-v1/#PodSpec)
 */
class K8sPodSpec {

    var containers: List<K8sContainer> = emptyList()

    class K8sContainer {

        lateinit var name: String

        var image: String? = null

    }
}