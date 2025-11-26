package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.PermissionResourceDTO
import io.github.vudsen.spectre.api.dto.StaticPermissionDTO
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.StaticPermissionPO
import org.springframework.data.domain.Page

interface StaticPermissionService {

    /**
     * 列出权限类型名称
     */
    fun listPermissionResources(): List<PermissionResourceDTO>


    /**
     * 根据权限名称获取权限
     */
    fun findPermissionsByResourceName(resourceName: String): Set<PermissionEntity>

    /**
     * 列出主体拥有的权限
     */
    fun listSubjectPermissions(
        subjectId: Long,
        type: SubjectType,
        page: Int,
        size: Int
    ): Page<StaticPermissionDTO>

    /**
     * 列出主体拥有的权限
     */
    fun listAllSubjectPermissions(
        subjectId: Long,
        type: SubjectType,
        resource: String,
    ): List<StaticPermissionDTO>

    /**
     * 批量修改权限
     */
    fun modifyPermissions(insertions: List<StaticPermissionPO>, deletions: List<StaticPermissionPO.StaticPermissionId>)

}