package io.github.vudsen.spectre.common.plugin.rnode

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
        return typedGetConfigurationForm(oldConfiguration as T?)
    }

    final override fun createRuntimeNode(config: RuntimeNodeConfig): RuntimeNode {
        return typedCreateRuntimeNode(config as T)
    }

    final override fun test(conf: RuntimeNodeConfig) {
        typedTest(conf as T)
    }

    final override fun filterSensitiveConfiguration(conf: RuntimeNodeConfig) {
        typedFilterSensitiveConfiguration(conf as T)
    }

    final override fun fillSensitiveConfiguration(
        updated: RuntimeNodeConfig,
        base: RuntimeNodeConfig
    ): RuntimeNodeConfig {
        return typedFillSensitiveConfiguration(updated as T, base as T)
    }

    final override fun createAttachHandler(
        runtimeNode: RuntimeNode,
        jvm: Jvm,
        bundles: ToolchainBundleDTO
    ): JvmAttachHandler {
        return typedCreateAttachHandler(runtimeNode as R, jvm, bundles)
    }

    abstract override fun getConfigurationClass(): Class<T>

    protected abstract fun typedGetConfigurationForm(oldConfiguration: T?): PageDescriptor

    protected abstract fun typedCreateRuntimeNode(config: T): R

    protected abstract fun typedTest(conf: T)

    protected abstract fun typedFilterSensitiveConfiguration(conf: T)

    protected abstract fun typedFillSensitiveConfiguration(updated: T, base: T): RuntimeNodeConfig

    protected abstract fun typedCreateAttachHandler(
        runtimeNode: R,
        jvm: Jvm,
        bundles: ToolchainBundleDTO
    ): JvmAttachHandler


}