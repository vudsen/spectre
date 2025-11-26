package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.common.plugin.RuntimeNodeExtManager
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.dto.RuntimeNodeTestDTO
import io.github.vudsen.spectre.repo.RuntimeNodeRepository
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO.Companion.toDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.util.concurrent.TimeUnit
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultRuntimeNodeService(
    private val repository: RuntimeNodeRepository,
    private val extManager: RuntimeNodeExtManager,
    private val redisTemplate: RedisTemplate<String, Any>
) : RuntimeNodeService {

    private val logger = LoggerFactory.getLogger(DefaultRuntimeNodeService::class.java)

    private val objectMapper = ObjectMapper()

    override fun insert(runtimeNodePO: RuntimeNodePO): Long {
        val saved = repository.save(runtimeNodePO)
        return saved.id!!
    }

    override fun getExtPoint(extPointId: String): RuntimeNodeExtensionPoint {
        return extManager.findById(extPointId)
    }

    override fun update(configuration: RuntimeNodePO) {
        repository.save(configuration)
    }

    override fun listRuntimeNodes(page: Int, size: Int): Page<RuntimeNodeDTO> {
        return repository.findAll(PageRequest.of(page, size)).map { po ->
            val dto = po.toDTO()
            filterSensitiveConfiguration(dto)
            dto
        }
    }



    override fun listPlugins(): Collection<RuntimeNodeExtensionPoint> {
        return extManager.listPlugins()
    }

    override fun saveRuntimeNode(po: RuntimeNodePO): RuntimeNodePO {
        val pluginId = po.pluginId!!
        val plugin = getExtPoint(pluginId)

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
        val plugin = getExtPoint(testObj.pluginId)
        val conf = objectMapper.readValue(testObj.configuration, plugin.getConfigurationClass())

        val runtimeNodeId = testObj.runtimeNodeId
        try {
            if (runtimeNodeId == null) {
                plugin.test(conf)
            } else {
                val node =
                    repository.findById(runtimeNodeId.toLong()).getOrNull() ?: throw BusinessException("运行节点不存在")
                plugin.test(
                    plugin.fillSensitiveConfiguration(
                        conf,
                        objectMapper.readValue(node.configuration, plugin.getConfigurationClass())
                    )
                )
            }
        } catch (e: Exception) {
            throw BusinessException(e.message ?: "测试失败: 未知原因")
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
        val runtimeNode = repository.findById(runtimeNodeId).get().toDTO()
        val ext =
            getExtPoint(runtimeNode.pluginId)
        val searcher = ext.createSearcher()

        val parentNode = if (parentNodeId == null) {
            null
        } else {
            findTreeNode(parentNodeId)
        }

        val nodes = searcher.expandTree(
            ext.connect(objectMapper.readValue(runtimeNode.configuration, ext.getConfigurationClass())),
            parentNode
        )
        return buildList {
            for (searchNode in nodes) {
                val id = "tree:$runtimeNodeId:${searchNode.pcFlag}:${searchNode.ctx?.hashCode()}"
                add(JvmTreeNodeDTO(id, searchNode.name, searchNode.isJvm))
                redisTemplate.opsForValue().setIfAbsent(id, searchNode, 10, TimeUnit.MINUTES)
            }
        }
    }

    private fun filterSensitiveConfiguration(dto: RuntimeNodeDTO) {
        val extPoint = getExtPoint(dto.pluginId)
        val nodeConfig = objectMapper.readValue(dto.configuration, extPoint.getConfigurationClass())
        extPoint.filterSensitiveConfiguration(nodeConfig)

        dto.configuration = objectMapper.writeValueAsString(nodeConfig)
    }

    override fun getRuntimeNode(runtimeNodeId: Long): RuntimeNodeDTO? {
        // TODO: 过滤敏感信息
        val dto = repository.findById(runtimeNodeId).getOrNull()?.toDTO() ?: return null
        filterSensitiveConfiguration(dto)
        return dto
    }

    override fun findTreeNode(id: String): JvmSearchNode<Any>? {
        val node = redisTemplate.opsForValue().get(id) as JvmSearchNode<Any>?
        node ?.let {
            redisTemplate.expire(id, 10, TimeUnit.MINUTES )
        }
        return node
    }


}