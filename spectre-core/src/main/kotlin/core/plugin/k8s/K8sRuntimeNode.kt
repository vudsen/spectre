package io.github.vudsen.spectre.core.plugin.k8s

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.core.plugin.k8s.entity.K8sPod
import io.github.vudsen.spectre.core.util.InsecureRequestFactory
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.RestClient

class K8sRuntimeNode(
    private val conf: K8sRuntimeNodeConfig,
    private val extensionPoint: K8sRuntimeNodeExtension
) : RuntimeNode {

    companion object {
        private val objectMapper: ObjectMapper

        private val ignoredNamespaces = setOf("kube-public", "kube-system")

        init {
            val objectMapper = ObjectMapper()
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            this.objectMapper = objectMapper
        }
    }

    private val restClient: RestClient

    init {
        val builder = RestClient.builder()
            .defaultHeader("Authorization", "Bearer ${conf.token}")
            .baseUrl(conf.apiServerEndpoint)
        if (conf.insecure) {
            builder.requestFactory(InsecureRequestFactory)
        }
        restClient = builder.build()
    }

    /**
     * See [pod](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/workload-resources/pod-v1/#list-%E5%88%97%E5%87%BA%E6%88%96%E8%A7%82%E5%AF%9F-pod-%E7%A7%8D%E7%B1%BB%E7%9A%84%E5%AF%B9%E8%B1%A1)
     */
    fun listPods(namespace: String): List<K8sPod> {
        val body = doRequest(restClient.get().uri("/api/v1/namespaces/${namespace}/pods").retrieve(), "namespaces/list") ?: return emptyList()
        val root = objectMapper.readTree(body)

        val items = root.get("items") ?: return emptyList()
        return objectMapper.treeToValue(items, K8sPodTypeReference)
    }

    private object K8sPodTypeReference : TypeReference<List<K8sPod>>()

    /**
     * 列出所有命名空间
     *
     * See [namespace](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/cluster-resources/namespace-v1/#list-%E5%88%97%E5%87%BA%E6%88%96%E8%80%85%E6%A3%80%E6%9F%A5%E7%B1%BB%E5%88%AB%E4%B8%BA-namespace-%E7%9A%84%E5%AF%B9%E8%B1%A1)
     */
    fun listNamespaces(): List<String> {
        val body = doRequest(
            restClient.get()
                .uri("/api/v1/namespaces")
                .retrieve()
        , "namespaces") ?: return emptyList()

        val root = objectMapper.readTree(body)

        val items = root.get("items") ?: return emptyList()
        return items.map { node -> node.get("metadata").get("name").asText() }.filter { s -> !ignoredNamespaces.contains(s) }
    }

    private fun doRequest(spec: RestClient.ResponseSpec, permission: String): String? {
        try {
            return spec.body(String::class.java)
        } catch (_: HttpClientErrorException.Forbidden) {
            throw BusinessException("权限不足，请确认您已为服务账号分配 `$permission` 权限")
        }
    }

    override fun ensureAttachEnvironmentReady() {
        try {
            doRequest(
                restClient.post()
                    .uri("/apis/authentication.k8s.io/v1/tokenreviews")
                    .body("""{ "apiVersion": "authentication.k8s.io/v1", "kind": "TokenReview", "spec": { "token": "${conf.token}" } }""")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
            , "tokenreviews")
        } catch (e: Exception) {
            throw BusinessException("测试失败: ${e.message}")
        }
        // TODO 校验权限和用户名
    }

    override fun getConfiguration(): K8sRuntimeNodeConfig {
        return conf
    }

    override fun getExtPoint(): RuntimeNodeExtensionPoint {
        return extensionPoint
    }


}