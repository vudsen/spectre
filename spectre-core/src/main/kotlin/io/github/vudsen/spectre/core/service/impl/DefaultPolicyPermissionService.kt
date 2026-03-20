package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.CreatePolicyPermissionDTO
import io.github.vudsen.spectre.api.dto.PermissionResourceDTO
import io.github.vudsen.spectre.api.dto.PolicyPermissionDTO
import io.github.vudsen.spectre.api.dto.PolicyPermissionDTO.Companion.toDTO
import io.github.vudsen.spectre.api.dto.UpdatePolicyPermissionDTO
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.perm.AppPermissions
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.service.PolicyPermissionService
import io.github.vudsen.spectre.repo.PolicyPermissionRepository
import io.github.vudsen.spectre.repo.entity.PolicyPermissionEnhancePlugin
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.PolicyPermissionPO
import io.github.vudsen.spectre.support.plugin.PolicyAuthenticationExtManager
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.json.JsonMapper
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultPolicyPermissionService(
    private val policyPermissionRepository: PolicyPermissionRepository,
    private val policyAuthenticationExtManager: PolicyAuthenticationExtManager,
) : PolicyPermissionService {
    private val objectMapper = JsonMapper.builderWithJackson2Defaults().build()

    @Transactional
    override fun savePolicyPermission(policy: CreatePolicyPermissionDTO): PolicyPermissionPO {
        for (plugin in policy.enhancePlugins) {
            plugin.configuration = purePluginConfig(plugin)
        }
        val po =
            PolicyPermissionPO().apply {
                subjectType = policy.subjectType
                subjectId = policy.subjectId
                resource = policy.resource
                action = policy.action
                conditionExpression = policy.conditionExpression
                description = policy.description
                enhancePlugins = policy.enhancePlugins
            }

        return policyPermissionRepository.save(po)
    }

    private fun purePluginConfig(plugin: PolicyPermissionEnhancePlugin): String {
        val extPoint = policyAuthenticationExtManager.getById(plugin.pluginId)
        val clazz = extPoint.getConfigurationClass()
        val obj =
            try {
                objectMapper.readValue(plugin.configuration, clazz)
            } catch (_: Exception) {
                throw BusinessException("无效的配置, 插件 id: ${extPoint.getId()}")
            }
        return objectMapper.writeValueAsString(obj)
    }

    @Transactional
    override fun updatePolicyPermission(dto: UpdatePolicyPermissionDTO) {
        val permissionPO = policyPermissionRepository.findById(dto.id).getOrNull() ?: throw BusinessException("策略权限不存在")
        permissionPO.conditionExpression = dto.conditionExpression
        permissionPO.description = dto.description
        for (plugin in dto.enhancePlugins) {
            plugin.configuration = purePluginConfig(plugin)
        }
        permissionPO.enhancePlugins = dto.enhancePlugins
    }

    override fun findById(id: Long): PolicyPermissionDTO? = policyPermissionRepository.findById(id).getOrNull()?.toDTO()

    override fun findPermissionsByResourceName(resourceName: String): Set<PermissionEntity> =
        AppPermissions.findPermissionsByResourceName(resourceName)

    override fun listPermissionResources(): List<PermissionResourceDTO> = AppPermissions.listPermissionResources()

    override fun deletePermission(id: Long) {
        policyPermissionRepository.deleteById(id)
    }

    override fun listSubjectPermissions(
        subjectId: Long,
        type: SubjectType,
        page: Int,
        size: Int,
    ): Page<PolicyPermissionDTO> =
        policyPermissionRepository
            .findAllBySubjectTypeAndSubjectId(type, subjectId, PageRequest.of(page, size))
            .map { po -> po.toDTO() }

    override fun resolveEnhanceConfigurationPage(permissionEntity: PermissionEntity): List<PageDescriptor> =
        policyAuthenticationExtManager
            .getExtPoints(permissionEntity)
            .map { extensionPoint -> extensionPoint.getConfigurationPage() }
}
