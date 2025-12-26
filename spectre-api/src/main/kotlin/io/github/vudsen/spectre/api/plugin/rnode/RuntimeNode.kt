package io.github.vudsen.spectre.api.plugin.rnode

import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint

interface RuntimeNode {

    /**
     * 确保 Attach 环境准备好了。
     *
     * 实现类至少应该在该方法中准备好对应的文件夹，例如 spectre home，并且检测是否具有相关的权限。
     */
    fun ensureAttachEnvironmentReady()

    /**
     * 获取配置
     */
    fun getConfiguration(): RuntimeNodeConfig

    /**
     * 获取当前拓展点
     */
    fun getExtPoint(): RuntimeNodeExtensionPoint

}