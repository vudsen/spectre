package io.github.vudsen.spectre.api.plugin.rnode

interface RuntimeNode {

    /**
     * 测试连接. 如果测试失败则直接报错
     */
    fun test()

    /**
     * 获取配置
     */
    fun getConfiguration(): RuntimeNodeConfig


}