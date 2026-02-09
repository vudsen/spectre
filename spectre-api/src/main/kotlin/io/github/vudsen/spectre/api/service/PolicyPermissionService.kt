package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.PermissionResourceDTO
import io.github.vudsen.spectre.api.dto.PolicyPermissionDTO
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.policy.PolicyPermissionContextExample
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.PolicyPermissionPO
import org.springframework.data.domain.Page

/**
 * 策略权限服务
 */
interface PolicyPermissionService {

    /**
     * 保存策略
     */
    fun save(policy: PolicyPermissionPO): PolicyPermissionPO

    /**
     * 根据id查询策略权限
     */
    fun findById(id: Long): PolicyPermissionDTO?


    /**
     * 根据权限名称获取权限
     */
    fun findPermissionsByResourceName(resourceName: String): Set<PermissionEntity>

    /**
     * 列出权限类型名称
     */
    fun listPermissionResources(): List<PermissionResourceDTO>
    /**
     * 删除权限
     */
    fun deletePermission(id: Long)

    /**
     * 列出主体已经绑定的权限
     */
    fun listSubjectPermissions(
        subjectId: Long,
        type: SubjectType,
        page: Int,
        size: Int
    ): Page<PolicyPermissionDTO>

    /**
     * 获取增强配置页面
     */
    fun resolveEnhanceConfigurationPage(permissionEntity: PermissionEntity): List<PageDescriptor>
}