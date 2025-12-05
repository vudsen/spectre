package io.github.vudsen.spectre.common.plugin.rnode

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.JvmAttachHandler

/**
 * 提供泛型支持，避免实现类进行过多的类型强转
 */
abstract class TypedRuntimeNodeExtensionPoint<T : RuntimeNodeConfig, R : RuntimeNode>(name: String) : RuntimeNodeExtensionPoint(name) {

    final override fun getConfigurationForm(oldConfiguration: RuntimeNodeConfig?): PageDescriptor {
        return getConfigurationForm0(oldConfiguration as T?)
    }

    final override fun getViewPage(runtimeNodeDTO: RuntimeNodeDTO, configuration: RuntimeNodeConfig): PageDescriptor {
        return getViewPage0(runtimeNodeDTO, configuration as T)
    }

    final override fun createRuntimeNode(config: RuntimeNodeConfig): RuntimeNode {
        return createRuntimeNode0(config as T)
    }

    final override fun test(conf: RuntimeNodeConfig) {
        test0(conf as T)
    }

    final override fun filterSensitiveConfiguration(conf: RuntimeNodeConfig) {
        filterSensitiveConfiguration0(conf as T)
    }

    final override fun fillSensitiveConfiguration(
        updated: RuntimeNodeConfig,
        base: RuntimeNodeConfig
    ): RuntimeNodeConfig {
        return fillSensitiveConfiguration0(updated as T, base as T)
    }

    final override fun createAttachHandler(
        runtimeNode: RuntimeNode,
        jvm: Jvm,
        bundles: ToolchainBundleDTO
    ): JvmAttachHandler {
        return createAttachHandler0(runtimeNode as R, jvm, bundles)
    }

    abstract override fun getConfigurationClass(): Class<T>

    protected abstract fun getConfigurationForm0(oldConfiguration: T?): PageDescriptor

    protected abstract fun createRuntimeNode0(config: T): R

    protected abstract fun test0(conf: T)

    protected abstract fun filterSensitiveConfiguration0(conf: T)

    protected abstract fun fillSensitiveConfiguration0(updated: T, base: T): RuntimeNodeConfig

    protected abstract fun getViewPage0(runtimeNodeDTO: RuntimeNodeDTO, configuration: T): PageDescriptor

    protected abstract fun createAttachHandler0(
        runtimeNode: R,
        jvm: Jvm,
        bundles: ToolchainBundleDTO
    ): JvmAttachHandler


}