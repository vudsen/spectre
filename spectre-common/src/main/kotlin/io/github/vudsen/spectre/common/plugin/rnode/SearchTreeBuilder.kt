package io.github.vudsen.spectre.common.plugin.rnode

import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearcher
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode


private typealias SearchChild<ParentCtx, ChildCtx> = (RuntimeNode, node: JvmSearchNode<ParentCtx>) -> List<JvmSearchNode<ChildCtx>>
private typealias JvmDeserializer = (JvmSearchNode<*>) -> Jvm
/**
 * 搜索树 Builder.
 *
 * 支持使用更加直观的方法来构建搜索树，详见：[io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeExtension.searcher]
 */
class SearchTreeBuilder private constructor() {


    private val handlerMap = mutableMapOf<Int, MutableList<HandlerParam>>()

    private var autoId = 1

    companion object {


        /**
         * 从上下文中反序列化 JVM
         */
        fun create(): SearchTreeBuilder {
            return SearchTreeBuilder()
        }

    }

    class HandlerParam(
        val handler: SearchChild<Any, Any>,
        val pc: Int
    )

    class JvmSearcherImpl(
        private val handlerMap: Map<Int, MutableList<HandlerParam>>,
        private val deserializer: JvmDeserializer
    ) : JvmSearcher {

        private val fakeRootNode: JvmSearchNode<Any> = JvmSearchNode<Any>("", false, null).apply { pcFlag = 0 }

        override fun expandTree(
            runtimeNode: RuntimeNode,
            node: JvmSearchNode<Any>?
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

        override fun deserializeJvm(jvm: JvmSearchNode<Any>): Jvm {
            return deserializer(jvm)
        }


    }

    private val rootNode = SearchTreeBuilderNode<Nothing>(0)

    fun build(deserializer: JvmDeserializer): JvmSearcher {
        return JvmSearcherImpl(handlerMap, deserializer)
    }

    fun <T> addHandler(handler: SearchChild<Nothing, T>): SearchTreeBuilderNode<T> {
        return rootNode.addHandler(handler)
    }

    inner class SearchTreeBuilderNode<PC>(private val pc: Int) {
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

        fun getCurrentPc(): Int {
            return pc
        }

    }



}