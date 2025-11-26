package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.PermissionResourceDTO
import io.github.vudsen.spectre.api.dto.StaticPermissionDTO
import io.github.vudsen.spectre.api.dto.StaticPermissionDTO.Companion.toDTO
import io.github.vudsen.spectre.repo.StaticPermissionRepository
import io.github.vudsen.spectre.api.service.StaticPermissionService
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.perm.ACLPermissions
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.StaticPermissionPO
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DefaultStaticPermissionService(
    private val staticPermissionRepository: StaticPermissionRepository
) : StaticPermissionService {

    override fun listPermissionResources(): List<PermissionResourceDTO> {
        return ACLPermissions.listPermissionResources()
    }


    override fun findPermissionsByResourceName(resourceName: String): Set<PermissionEntity> {
        return ACLPermissions.findPermissionsByResourceName(resourceName)
    }

    override fun listSubjectPermissions(
        subjectId: Long,
        type: SubjectType,
        page: Int,
        size: Int
    ): Page<StaticPermissionDTO> {
        return staticPermissionRepository.findAllByIdSubjectTypeAndIdSubjectId(
            type,
            subjectId,
            PageRequest.of(page, size)
        ).map { permissionPO -> permissionPO.toDTO() }
    }


    override fun listAllSubjectPermissions(
        subjectId: Long,
        type: SubjectType,
        resource: String
    ): List<StaticPermissionDTO> {
        return staticPermissionRepository.findAllByIdSubjectTypeAndIdSubjectIdAndIdResource(type, subjectId, resource)
            .map { permissionPO -> permissionPO.toDTO() }
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun modifyPermissions(
        insertions: List<StaticPermissionPO>,
        deletions: List<StaticPermissionPO.StaticPermissionId>
    ) {
        staticPermissionRepository.saveAll(insertions)
        staticPermissionRepository.deleteAllById(deletions)
    }


}