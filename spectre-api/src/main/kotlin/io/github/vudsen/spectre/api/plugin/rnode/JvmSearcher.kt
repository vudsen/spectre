package io.github.vudsen.spectre.api.plugin.rnode

import io.github.vudsen.spectre.common.Jvm

interface JvmSearcher {
    fun expandTree(
        runtimeNode: RuntimeNode,
        node: JvmSearchNode<Any>?,
    ): List<JvmSearchNode<Any>>

    /**
     * 按照 [paths] 列出所有该路径下，**所有同级节点**
     */
    fun findNode(
        runtimeNode: RuntimeNode,
        paths: List<String>,
    ): JvmSearchNode<Any>?

    /**
     * 反序列化 [expandTree] 中的上下文，返回一个 jvm 节点
     */
    fun deserializeJvm(jvm: JvmSearchNode<Any>): Jvm
}
