package io.github.vudsen.spectre.core.plugin.k8s.entity

/**
 * [ObjectMeta](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/common-definitions/object-meta/#ObjectMeta)
 */
data class K8sObjectMeta(
    var name: String = "",

    var namespace: String = ""
)