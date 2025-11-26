package io.github.vudsen.spectre.core.plugin.k8s.entity

/**
 * [ObjectMeta](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/common-definitions/object-meta/#ObjectMeta)
 */
class K8sObjectMeta {


    lateinit var name: String;

    var namespace: String? = null

}