package io.github.vudsen.spectre.api.plugin.rnode

interface JvmSearcher {


    fun expandTree(runtimeNode: RuntimeNode, node: JvmSearchNode<Any>?): List<JvmSearchNode<Any>>

    /**
     * 反序列化 [expandTree] 中的上下文，返回一个 jvm 节点
     */
    fun deserializeJvm(jvm: JvmSearchNode<Any>): Jvm

}