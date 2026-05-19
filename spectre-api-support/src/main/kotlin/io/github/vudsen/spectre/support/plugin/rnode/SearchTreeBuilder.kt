package io.github.vudsen.spectre.support.plugin.rnode

import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearcher
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode
import io.github.vudsen.spectre.common.Jvm

private typealias SearchChild<ParentCtx, ChildCtx> = (RuntimeNode, node: JvmSearchNode<ParentCtx>) -> List<JvmSearchNode<ChildCtx>>
private typealias JvmDeserializer = (JvmSearchNode<*>) -> Jvm

/**
 * 搜索树 Builder.
 *
 * 支持使用更加直观的方法来构建搜索树，详见：[io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeExtension.searcher]
 *
 * 设计思路: 一个树节点下可以添加多个 [HandlerParam]，每个节点都有自己的 pcFlag，[handlerMap] 记录了某个 pcFlag 下的 [HandlerParam]
 */
class SearchTreeBuilder private constructor() {
    private val handlerMap = mutableMapOf<Int, MutableList<HandlerParam>>()

    private var autoId = 1

    companion object {
        /**
         * 从上下文中反序列化 JVM
         */
        fun create(): SearchTreeBuilder = SearchTreeBuilder()
    }

    class HandlerParam(
        val handler: SearchChild<Any, Any>,
        val pc: Int,
    )

    class JvmSearcherImpl(
        private val handlerMap: Map<Int, MutableList<HandlerParam>>,
        private val deserializer: JvmDeserializer,
    ) : JvmSearcher {
        private val fakeRootNode: JvmSearchNode<Any> = JvmSearchNode<Any>("", false, null, emptyList()).apply { pcFlag = 0 }

        override fun expandTree(
            runtimeNode: RuntimeNode,
            node: JvmSearchNode<Any>?,
        ): List<JvmSearchNode<Any>> {
            val currentNode: JvmSearchNode<Any> = node ?: fakeRootNode
            val handlerParams = handlerMap[currentNode.pcFlag] ?: emptyList()
            val result = mutableListOf<JvmSearchNode<Any>>()
            for (param in handlerParams) {
                val nodes = param.handler.invoke(runtimeNode, currentNode)
                nodes.forEach { node -> node.pcFlag = param.pc }
                result.addAll(nodes)
            }
            return result
        }

        override fun findNode(
            runtimeNode: RuntimeNode,
            paths: List<String>,
        ): JvmSearchNode<Any>? {
            var currentNode = fakeRootNode
            var depth = 0
            while (depth < paths.size) {
                val nodes = expandTree(runtimeNode, currentNode)
                for (node in nodes) {
                    if (paths[depth] != node.idPath[depth]) {
                        continue
                    }
                    if (paths.size > node.idPath.size) {
                        currentNode = node
                        depth++
                        break
                    } else if (paths.size == node.idPath.size) {
                        return node
                    } else {
                        return null
                    }
                }
            }
            return null
        }

        override fun deserializeJvm(jvm: JvmSearchNode<Any>): Jvm = deserializer(jvm)
    }

    private val rootNode = SearchTreeBuilderNode<Nothing>(0)

    fun build(deserializer: JvmDeserializer): JvmSearcher = JvmSearcherImpl(handlerMap, deserializer)

    fun <T> addHandler(handler: SearchChild<Nothing, T>): SearchTreeBuilderNode<T> = rootNode.addHandler(handler)

    inner class SearchTreeBuilderNode<PC>(
        private val pc: Int,
    ) {
        fun <ReturnType> addHandler(handler: SearchChild<PC, ReturnType>): SearchTreeBuilderNode<ReturnType> {
            var searchers = handlerMap[pc]
            if (searchers == null) {
                searchers = mutableListOf()
                handlerMap[pc] = searchers
            }
            val myId = autoId
            autoId++
            searchers.add(HandlerParam(handler as SearchChild<Any, Any>, myId))
            return SearchTreeBuilderNode(myId)
        }

        fun getCurrentPc(): Int = pc
    }
}
