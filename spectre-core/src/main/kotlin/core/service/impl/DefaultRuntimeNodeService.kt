package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.common.plugin.RuntimeNodeExtManager
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.dto.RuntimeNodeTestDTO
import io.github.vudsen.spectre.repo.RuntimeNodeRepository
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode
import io.github.vudsen.spectre.core.configuration.constant.CacheConstant
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import org.slf4j.LoggerFactory
import org.springframework.cache.CacheManager
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultRuntimeNodeService(
    private val repository: RuntimeNodeRepository,
    private val extManager: RuntimeNodeExtManager,
    cacheManager: CacheManager
) : RuntimeNodeService {

    private val logger = LoggerFactory.getLogger(DefaultRuntimeNodeService::class.java)

    private val objectMapper = ObjectMapper()

    private val cache = cacheManager.getCache(CacheConstant.DEFAULT_CACHE_KEY)!!

    override fun insert(runtimeNodePO: RuntimeNodePO): Long {
        val saved = repository.save(runtimeNodePO)
        return saved.id!!
    }

    override fun findPluginById(extPointId: String): RuntimeNodeExtensionPoint {
        return extManager.findById(extPointId)
    }

    override fun update(configuration: RuntimeNodePO) {
        repository.save(configuration)
    }

    override fun listRuntimeNodes(page: Int, size: Int): Page<RuntimeNodeDTO> {
        return repository.findAll(PageRequest.of(page, size)).map { po ->
            val dto = po.toDTO(true)
            dto
        }
    }



    override fun listPlugins(): Collection<RuntimeNodeExtensionPoint> {
        return extManager.listPlugins()
    }

    override fun saveRuntimeNode(po: RuntimeNodePO): RuntimeNodePO {
        val pluginId = po.pluginId!!
        val plugin = findPluginById(pluginId)

        val updated = objectMapper.readValue(po.configuration, plugin.getConfigurationClass())
        po.id?.let {
            val node = repository.findById(it).getOrNull() ?: throw BusinessException("节点不存在")
            plugin.fillSensitiveConfiguration(
                updated,
                objectMapper.readValue(node.configuration, plugin.getConfigurationClass())
            )
        }

        try {
            plugin.test(updated)
        } catch (e: Exception) {
            logger.debug("Test Failed", e)
            throw BusinessException(e.message ?: "测试失败")
        }
        // 过滤多余字段
        po.configuration = objectMapper.writeValueAsString(updated)
        return repository.save(po)
    }

    override fun test(testObj: RuntimeNodeTestDTO) {
        val plugin = findPluginById(testObj.pluginId)
        val conf = objectMapper.readValue(testObj.configuration, plugin.getConfigurationClass())

        val runtimeNodeId = testObj.runtimeNodeId
        if (runtimeNodeId == null) {
            plugin.test(conf)
        } else {
            val runtimeNodeDTO = findPureRuntimeNodeById(runtimeNodeId.toLong()) ?: throw BusinessException("运行节点不存在")
            plugin.test(
                plugin.fillSensitiveConfiguration(
                    conf,
                    runtimeNodeDTO.configuration
                )
            )
        }
    }

    override fun deleteById(id: Long) {
        repository.deleteById(id)
    }

    /**
     * 展开节点树。
     *
     * 每个节点都会生成一个唯一 id，同时该节点将会在一定时间内被缓存，如果长时间没有使用，将会被删除，此时需要重新从根节点展开。
     */
    override fun expandRuntimeNodeTree(runtimeNodeId: Long, parentNodeId: String?): List<JvmTreeNodeDTO> {
        val runtimeNode = findPureRuntimeNodeById(runtimeNodeId) ?: throw BusinessException("节点不存在")
        val ext =
            findPluginById(runtimeNode.pluginId)
        val searcher = ext.createSearcher()

        val parentNode = if (parentNodeId == null) {
            null
        } else {
            findTreeNode(parentNodeId)
        }

        val nodes = searcher.expandTree(
            ext.connect(runtimeNode.configuration),
            parentNode
        )
        return buildList {
            for (searchNode in nodes) {
                // Should we use random id?
                val id = "tree:$runtimeNodeId:${searchNode.hashCode()}"
                add(JvmTreeNodeDTO(id, searchNode.name, searchNode.isJvm))
                cache.putIfAbsent(id, searchNode)
            }
        }
    }


    override fun getRuntimeNode(runtimeNodeId: Long): RuntimeNodeDTO? {
        val dto = repository.findById(runtimeNodeId).getOrNull()?.toDTO(true) ?: return null
        return dto
    }

    override fun findPureRuntimeNodeById(runtimeNodeId: Long): RuntimeNodeDTO? {
        return repository.findById(runtimeNodeId).getOrNull()?.toDTO()
    }

    override fun findTreeNode(id: String): JvmSearchNode<Any>? {
        return cache[id]?.get() as JvmSearchNode<Any>?
    }

    override fun deserializeToJvm(pluginId: String, node: JvmSearchNode<Any>): Jvm {
        return findPluginById(pluginId).createSearcher().deserializeJvm(node)
    }

    fun RuntimeNodePO.toDTO(filterSensitiveProps: Boolean = false): RuntimeNodeDTO {
        val myPluginId = pluginId!!
        val extensionPoint = findPluginById(myPluginId)
        val nodeConfig = objectMapper.readValue(configuration!!, extensionPoint.getConfigurationClass())
        if (filterSensitiveProps) {
            extensionPoint.filterSensitiveConfiguration(nodeConfig)
        }
        return RuntimeNodeDTO(
            id!!,
            name!!,
            myPluginId,
            nodeConfig,
            createdAt!!,
            labels ?: emptyMap(),
            restrictedMode!!
        )
    }

    override fun connect(runtimeNodeId: Long): RuntimeNode {
        val runtimeNodeDTO = repository.findById(runtimeNodeId).getOrNull()?.toDTO() ?: throw BusinessException("节点不存在")
        val extPoint = findPluginById(runtimeNodeDTO.pluginId)
        return extPoint.connect(runtimeNodeDTO.configuration)
    }


    override fun resolveViewPage(runtimeNodeId: Long): PageDescriptor {
        val dto = repository.findById(runtimeNodeId).getOrNull()?.toDTO(true) ?: throw BusinessException("节点不存在")
        val ext = extManager.findById(dto.pluginId)
        return ext.getViewPage(dto, dto.configuration)
    }


}