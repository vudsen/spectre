package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.CreateRuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.RuntimeNodeTestDTO
import io.github.vudsen.spectre.api.dto.UpdateRuntimeNodeDTO
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import org.springframework.data.domain.Page

interface RuntimeNodeService {

    /**
     * 插入一个新的宿主机
     * @return 宿主机id
     */
    fun insert(runtimeNodePO: RuntimeNodePO): Long

    /**
     * 获取拓展点.
     *
     * 如果扩展不存在，则会直接抛出异常
     */
    fun findPluginById(extPointId: String): RuntimeNodeExtensionPoint

    /**
     * 更新一个宿主机
     */
    fun update(runtimeNodePO: RuntimeNodePO)

    /**
     * 列出所有宿主机配置
     */
    fun listRuntimeNodes(page: Int, size: Int): Page<RuntimeNodeDTO>

    /**
     * 列出所有插件
     */
    fun listPlugins(): Collection<RuntimeNodeExtensionPoint>

    /**
     * 创建运行节点
     */
    fun createRuntimeNode(dto: CreateRuntimeNodeDTO): RuntimeNodePO

    /**
     * 保存节点
     */
    fun updateRuntimeNode(dto: UpdateRuntimeNodeDTO): RuntimeNodePO


    /**
     * 测试连接
     */
    fun test(testObj: RuntimeNodeTestDTO)

    /**
     * 根据 id 删除节点
     */
    fun deleteById(id: Long)

    /**
     * 展开节点树
     */
    fun expandRuntimeNodeTree(runtimeNodeId: Long, parentNodeId: String?): List<JvmTreeNodeDTO>

    /**
     * 获取运行时节点. 该方法会过滤敏感信息，如果需要敏感信息，请使用 [findPureRuntimeNodeById]
     */
    fun getRuntimeNode(runtimeNodeId: Long): RuntimeNodeDTO?

    /**
     * 获取运行时节点，包含敏感信息
     */
    fun findPureRuntimeNodeById(runtimeNodeId: Long): RuntimeNodeDTO?

    /**
     * 获取树节点
     */
    fun findTreeNode(id: String): JvmSearchNode<Any>?

    /**
     * 将树节点转换为对应的 jvm
     */
    fun deserializeToJvm(pluginId: String, node: JvmSearchNode<Any>): Jvm

    /**
     * 获取运行节点
     */
    fun connect(runtimeNodeId: Long): RuntimeNode

    /**
     * 获取详情界面
     */
    fun resolveViewPage(runtimeNodeId: Long): PageDescriptor

}