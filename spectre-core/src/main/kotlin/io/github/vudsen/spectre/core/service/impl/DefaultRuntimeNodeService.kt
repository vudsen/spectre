package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.CreateRuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.RuntimeNodeTestDTO
import io.github.vudsen.spectre.api.dto.UpdateRuntimeNodeDTO
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.core.configuration.constant.CacheConstant
import io.github.vudsen.spectre.repo.RuntimeNodeRepository
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import io.github.vudsen.spectre.support.plugin.RuntimeNodeExtManager
import io.github.vudsen.spectre.support.secure.SecretSupportedObjectMapper
import org.springframework.cache.CacheManager
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultRuntimeNodeService(
    private val runtimeNodeRepository: RuntimeNodeRepository,
    private val extManager: RuntimeNodeExtManager,
    cacheManager: CacheManager,
) : RuntimeNodeService {
    private val objectMapper = SecretSupportedObjectMapper.instance

    private val cache = cacheManager.getCache(CacheConstant.DEFAULT_CACHE_KEY)!!

    override fun findPluginById(extPointId: String): RuntimeNodeExtensionPoint = extManager.findById(extPointId)

    override fun listRuntimeNodes(
        page: Int,
        size: Int,
    ): Page<RuntimeNodeDTO> =
        runtimeNodeRepository.findAll(PageRequest.of(page, size)).map { po ->
            val dto = po.toDTO(true)
            dto
        }

    override fun listPlugins(): Collection<RuntimeNodeExtensionPoint> = extManager.listPlugins()

    override fun createRuntimeNode(dto: CreateRuntimeNodeDTO): RuntimeNodePO {
        val extensionPoint = extManager.findById(dto.pluginId)
        val configurationObj = objectMapper.readValue(dto.configuration, extensionPoint.getConfigurationClass())
        val pureConfiguration = objectMapper.writeValueAsString(configurationObj)

        val po =
            RuntimeNodePO().apply {
                name = dto.name
                pluginId = dto.pluginId
                configuration = pureConfiguration
                restrictedMode = dto.restrictedMode ?: false
                labels = dto.labels
            }
        runtimeNodeRepository.save(po)
        return po
    }

    override fun updateRuntimeNode(dto: UpdateRuntimeNodeDTO): RuntimeNodePO {
        val oldEntity =
            runtimeNodeRepository.findById(dto.id).getOrNull()
                ?: throw BusinessException("error.runtime.node.not.exist")

        dto.labels?.let {
            oldEntity.labels = it
        }
        dto.restrictedMode?.let {
            oldEntity.restrictedMode = it
        }
        dto.configuration?.let {
            if (it != oldEntity.configuration) {
                val extensionPoint = extManager.findById(oldEntity.pluginId)
                val full =
                    extensionPoint.fillSensitiveConfiguration(
                        objectMapper.readValue(it, extensionPoint.getConfigurationClass()),
                        objectMapper.readValue(oldEntity.configuration, extensionPoint.getConfigurationClass()),
                    )
                oldEntity.configuration = objectMapper.writeValueAsString(full)
            }
        }
        dto.name?.let {
            oldEntity.name = it
        }
        runtimeNodeRepository.save(oldEntity)
        return oldEntity
    }

    override fun test(testObj: RuntimeNodeTestDTO) {
        val plugin = findPluginById(testObj.pluginId)
        val conf = objectMapper.readValue(testObj.configuration, plugin.getConfigurationClass())

        val runtimeNodeId = testObj.runtimeNodeId
        if (runtimeNodeId == null) {
            plugin.test(conf)
        } else {
            val runtimeNodeDTO = findPureRuntimeNodeById(runtimeNodeId.toLong()) ?: throw BusinessException("error.runtime.node.not.exist")
            plugin.test(
                plugin.fillSensitiveConfiguration(
                    conf,
                    runtimeNodeDTO.configuration,
                ),
            )
        }
    }

    override fun deleteById(id: Long) {
        runtimeNodeRepository.deleteById(id)
    }

    /**
     * 展开节点树。
     *
     * 每个节点都会生成一个唯一 id，同时该节点将会在一定时间内被缓存，如果长时间没有使用，将会被删除，此时需要重新从根节点展开。
     */
    override fun expandRuntimeNodeTree(
        runtimeNodeId: Long,
        parentNodeId: String?,
    ): List<JvmTreeNodeDTO> {
        val runtimeNode = findPureRuntimeNodeById(runtimeNodeId) ?: throw BusinessException("error.node.not.exist")
        val ext =
            findPluginById(runtimeNode.pluginId)
        val searcher = ext.createSearcher()

        val parentNode =
            if (parentNodeId == null) {
                null
            } else {
                findTreeNode(parentNodeId)
            }

        val nodes =
            searcher.expandTree(
                ext.connect(runtimeNode.configuration),
                parentNode,
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
        val dto = runtimeNodeRepository.findById(runtimeNodeId).getOrNull()?.toDTO(true) ?: return null
        return dto
    }

    override fun findPureRuntimeNodeById(runtimeNodeId: Long): RuntimeNodeDTO? =
        runtimeNodeRepository.findById(runtimeNodeId).getOrNull()?.toDTO()

    override fun findTreeNode(id: String): JvmSearchNode<Any>? = cache[id]?.get() as JvmSearchNode<Any>?

    override fun deserializeToJvm(
        pluginId: String,
        node: JvmSearchNode<Any>,
    ): Jvm = findPluginById(pluginId).createSearcher().deserializeJvm(node)

    fun RuntimeNodePO.toDTO(filterSensitiveProps: Boolean = false): RuntimeNodeDTO {
        val myPluginId = pluginId
        val extensionPoint = findPluginById(myPluginId)
        val nodeConfig = objectMapper.readValue(configuration, extensionPoint.getConfigurationClass())
        if (filterSensitiveProps) {
            extensionPoint.filterSensitiveConfiguration(nodeConfig)
        }
        return RuntimeNodeDTO(
            id,
            name,
            myPluginId,
            nodeConfig,
            createdAt!!,
            labels ?: emptyMap(),
            restrictedMode!!,
        )
    }

    override fun connect(runtimeNodeId: Long): RuntimeNode {
        val runtimeNodeDTO =
            runtimeNodeRepository.findById(runtimeNodeId).getOrNull()?.toDTO() ?: throw BusinessException("error.node.not.exist")
        val extPoint = findPluginById(runtimeNodeDTO.pluginId)
        return extPoint.connect(runtimeNodeDTO.configuration)
    }

    override fun resolveViewPage(runtimeNodeId: Long): PageDescriptor {
        val dto = runtimeNodeRepository.findById(runtimeNodeId).getOrNull()?.toDTO(true) ?: throw BusinessException("error.node.not.exist")
        val ext = extManager.findById(dto.pluginId)
        return ext.getViewPage(dto, dto.configuration)
    }
}
