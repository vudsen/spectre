package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.common.plugin.PolicyAuthenticationExtManager
import io.github.vudsen.spectre.api.dto.PolicyPermissionDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.repo.PolicyPermissionRepository
import io.github.vudsen.spectre.api.dto.PolicyPermissionDTO.Companion.toDTO
import io.github.vudsen.spectre.api.service.PolicyPermissionService
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.perm.PolicyPermissions
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.PolicyPermissionPO
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultPolicyPermissionService(
    private val policyPermissionRepository: PolicyPermissionRepository,
    private val policyAuthenticationExtManager: PolicyAuthenticationExtManager
) : PolicyPermissionService {

    private val objectMapper = ObjectMapper()

    override fun save(policy: PolicyPermissionPO): PolicyPermissionPO {
        for (plugin in policy.enhancePlugins) {
            val extPoint = policyAuthenticationExtManager.getById(plugin.pluginId)
            val clazz = extPoint.getConfigurationClass()
            val obj = try {
                objectMapper.readValue(plugin.configuration, clazz)
            } catch (_: Exception) {
                throw BusinessException("无效的配置, 插件 id: ${extPoint.getId()}")
            }
            plugin.configuration = objectMapper.writeValueAsString(obj)
        }
        return policyPermissionRepository.save(policy)
    }

    override fun findById(id: Long): PolicyPermissionDTO? {
        return policyPermissionRepository.findById(id).getOrNull()?.toDTO()
    }


    override fun listAllPermissions(): Set<PermissionEntity> {
        return PolicyPermissions.listAllPermissions()
    }

    override fun deletePermission(id: Long) {
        policyPermissionRepository.deleteById(id)
    }

    override fun listSubjectPermissions(
        subjectId: Long,
        type: SubjectType,
        page: Int,
        size: Int
    ): Page<PolicyPermissionDTO> {
        return policyPermissionRepository.findAllBySubjectTypeAndSubjectId(type, subjectId, PageRequest.of(page, size))
            .map { po -> po.toDTO() }
    }

    override fun resolveEnhanceConfigurationPage(permissionEntity: PermissionEntity): List<PageDescriptor> {
        return policyAuthenticationExtManager.getExtPoints(permissionEntity)
            .map { extensionPoint -> extensionPoint.getConfigurationPage() }
    }

}