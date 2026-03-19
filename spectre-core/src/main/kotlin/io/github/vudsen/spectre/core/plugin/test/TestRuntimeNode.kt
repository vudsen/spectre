package io.github.vudsen.spectre.core.plugin.test

import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode
import io.github.vudsen.spectre.common.RuntimeNodeConfig

class TestRuntimeNode(
    private val conf: TestRuntimeNodeConfig,
    private val plugin: RuntimeNodeExtensionPoint,
) : RuntimeNode {
    override fun ensureAttachEnvironmentReady() {}

    override fun getConfiguration(): RuntimeNodeConfig = conf

    override fun getExtPoint(): RuntimeNodeExtensionPoint = plugin
}
