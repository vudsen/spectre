package io.github.vudsen.spectre.core.plugin.test

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmAttachHandler
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearcher
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.common.plugin.rnode.SearchTreeBuilder
import io.github.vudsen.spectre.common.plugin.rnode.TypedRuntimeNodeExtensionPoint
import org.springframework.stereotype.Component

/**
 * 用于开发或测试的节点
 */
@Component
class TestRuntimeNodeExtension : TypedRuntimeNodeExtensionPoint<TestRuntimeNodeConfig, TestRuntimeNode>("Test") {

    object TestJvm : Jvm("1", "Test Jvm")

    private val searcher: JvmSearcher by lazy {
        val builder = SearchTreeBuilder.create()

        builder.addHandler { _, _ ->
            return@addHandler listOf(JvmSearchNode("Test Jvm", true, null))
        }

        builder.build {
            return@build TestJvm
        }
    }

    override fun getConfigurationClass(): Class<TestRuntimeNodeConfig> {
        return TestRuntimeNodeConfig::class.java
    }

    override fun getConfigurationForm0(oldConfiguration: TestRuntimeNodeConfig?): PageDescriptor {
        return PageDescriptor("form/TestNodeForm", null)
    }

    override fun createRuntimeNode0(config: TestRuntimeNodeConfig): TestRuntimeNode {
        return TestRuntimeNode(config, this)
    }

    override fun test0(conf: TestRuntimeNodeConfig) {}

    override fun filterSensitiveConfiguration0(conf: TestRuntimeNodeConfig) {}

    override fun fillSensitiveConfiguration0(
        updated: TestRuntimeNodeConfig,
        base: TestRuntimeNodeConfig
    ): RuntimeNodeConfig {
        return base
    }

    override fun getViewPage0(
        runtimeNodeDTO: RuntimeNodeDTO,
        configuration: TestRuntimeNodeConfig
    ): PageDescriptor {
        TODO("Not yet implemented")
    }

    override fun createAttachHandler0(
        runtimeNode: TestRuntimeNode,
        jvm: Jvm,
        bundles: ToolchainBundleDTO
    ): JvmAttachHandler {
        return TestAttachHandler()
    }

    override fun getDescription(): String {
        return "A runtime node for test or development."
    }

    override fun isCloseableRuntimeNode(): Boolean {
        return false
    }

    override fun createSearcher(): JvmSearcher {
        return searcher
    }

    override fun getId(): String {
        return "TestRuntimeNodeExtension"
    }
}