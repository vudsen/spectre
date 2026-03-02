package io.github.vudsen.spectre.core.plugin.k8s.entity

/**
 * [Pod](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/workload-resources/pod-v1/#Pod)
 */
class K8sPod {

    lateinit var metadata: K8sObjectMeta

    lateinit var spec: K8sPodSpec

    lateinit var status: K8sPodStatus

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as K8sPod

        if (metadata != other.metadata) return false
        if (spec != other.spec) return false
        if (status != other.status) return false

        return true
    }

    override fun hashCode(): Int {
        var result = metadata.hashCode()
        result = 31 * result + spec.hashCode()
        result = 31 * result + status.hashCode()
        return result
    }


}