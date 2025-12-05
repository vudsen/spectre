package io.github.vudsen.spectre.api.plugin

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.plugin.rnode.CloseableRuntimeNode
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmAttachHandler
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearcher
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.api.plugin.rnode.pool.ResourcesPool
import io.github.vudsen.spectre.api.plugin.rnode.pool.RuntimeNodeResourcesPoolRegister
import org.springframework.cglib.proxy.Enhancer
import org.springframework.cglib.proxy.MethodInterceptor
import org.springframework.cglib.proxy.MethodProxy
import java.lang.reflect.Method
import java.util.WeakHashMap

/**
 * 运行节点扩展点.
 */
abstract class RuntimeNodeExtensionPoint (
    val name: String
) : ExtensionPoint {

    private val instanceCache = WeakHashMap<RuntimeNodeConfig, RuntimeNode>()

    final override fun getExtensionPointName(): String {
        return "RuntimeNode"
    }

    /**
     * 获取描述，可以使用 html 富文本
     */
    abstract fun getDescription(): String

    /**
     * 获取配置表单
     */
    abstract fun getConfigurationForm(oldConfiguration: RuntimeNodeConfig?): PageDescriptor

    /**
     * 获取查看页面
     * @param runtimeNodeDTO 已经过滤敏感字段后的数据
     * @param configuration 完整的配置，包含敏感字段
     */
    abstract fun getViewPage(runtimeNodeDTO: RuntimeNodeDTO, configuration: RuntimeNodeConfig): PageDescriptor

    /**
     * 获取配置的类名
     */
    abstract fun getConfigurationClass(): Class<out RuntimeNodeConfig>

    /**
     * 使用配置连接宿主机.
     */
    protected abstract fun createRuntimeNode(config: RuntimeNodeConfig): RuntimeNode

    /**
     * 是否为可关闭的运行时节点
     */
    protected abstract fun isCloseableRuntimeNode(): Boolean

    /**
     * 若 [isCloseableRuntimeNode] 返回了 true，[connect] 方法将会返回一个代理类，代理类实现的接口需要在这里指定
     */
    protected open fun runtimeNodeClass(): Class<*> {
        return Nothing::class.java
    }

    private class RuntimeNodeProxy(private val pool: ResourcesPool, private val config: RuntimeNodeConfig) :
        MethodInterceptor {

        override fun intercept(
            obj: Any?,
            method: Method,
            args: Array<out Any?>,
            proxy: MethodProxy?
        ): Any? {
            RuntimeNodeResourcesPoolRegister.reportInUsing(config)
            val node = pool.borrow()
            return try {
                method.invoke(node, *args)
            } finally {
                pool.retrieve(node)
            }
        }

    }

    fun connect(config: RuntimeNodeConfig): RuntimeNode {
        val node = instanceCache[config]
        if (node != null) {
            return node
        }
        if (isCloseableRuntimeNode()) {
            val pool = RuntimeNodeResourcesPoolRegister.getPool(config) {
                createRuntimeNode(config) as CloseableRuntimeNode
            }
            val enhancer = Enhancer()
            enhancer.setSuperclass(runtimeNodeClass())
            enhancer.setCallback(RuntimeNodeProxy(pool, config))
            val instance = enhancer.create()
            instanceCache[config] = node
            return instance as RuntimeNode
        }
        val n = createRuntimeNode(config)
        instanceCache[config] = n
        return n
    }

    /**
     * 测试连接
     */
    abstract fun test(conf: RuntimeNodeConfig)

    /**
     * 过滤配置中的所有敏感信息
     */
    abstract fun filterSensitiveConfiguration(conf: RuntimeNodeConfig)

    /**
     * 填充敏感信息到 [updated] 中。该方法用于更新节点时，重新填充敏感信息到配置中
     * @param updated 客户端传入的最新配置，密码等信息可能为空, 需要通过 [base] 参数进行填充. **如果密码信息非空，则不要替换**！
     * @param base 数据库中的配置
     * @return [updated]
     */
    abstract fun fillSensitiveConfiguration(updated: RuntimeNodeConfig, base: RuntimeNodeConfig): RuntimeNodeConfig


    /**
     * 创建 jvm searcher
     */
    abstract fun createSearcher(): JvmSearcher

    /**
     * 创建 attach handler
     */
    abstract fun createAttachHandler(runtimeNode: RuntimeNode, jvm: Jvm, bundles: ToolchainBundleDTO): JvmAttachHandler

}