package io.github.vudsen.spectre.api.plugin.rnode

import com.fasterxml.jackson.annotation.JsonProperty

/**
 * Jvm 搜索节点
 */
data class JvmSearchNode<T>(
    /**
     * 节点名称
     */
    var name: String,
    /**
     * 是否为 JVM 节点
     */
    @field:JsonProperty("isJvm")
    var isJvm: Boolean,
    /**
     * 当前上下文. 用于下一次搜索. 必须提供 [hashCode] 方法的重写
     */
    var ctx: T?
) {

    /**
     * 反序列化使用
     */
    constructor() : this("", false, null)

    /**
     * 下一步搜索的标识
     */
    var pcFlag: Int = -1
}