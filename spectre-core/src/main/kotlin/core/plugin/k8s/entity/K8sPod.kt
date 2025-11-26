package io.github.vudsen.spectre.core.plugin.k8s.entity

/**
 * [Pod](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/workload-resources/pod-v1/#Pod)
 */
class K8sPod {

    lateinit var metadata: K8sObjectMeta

    lateinit var spec: K8sPodSpec

    lateinit var status: K8sPodStatus

}