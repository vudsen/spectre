package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.core.bean.PageResult
import io.github.vudsen.spectre.core.bean.toPageResult
import io.github.vudsen.spectre.api.dto.StaticPermissionDTO
import io.github.vudsen.spectre.api.service.StaticPermissionService
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.repo.entity.SubjectType
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller

@Controller
@SchemaMapping(typeName = "StaticPermissionQueries")
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).PERMISSION_READ)")
class StaticPermissionQueriesController(
    private val staticPermissionService: StaticPermissionService
) {

    object StaticPermissionQueries

    @QueryMapping
    fun staticPermission(): StaticPermissionQueries {
        return StaticPermissionQueries
    }

    /**
     * 列出当前主体持有的权限
     */
    @SchemaMapping
    fun permissions(
        @Argument subjectId: String,
        @Argument subjectType: SubjectType,
        @Argument page: Int,
        @Argument size: Int
    ): PageResult<StaticPermissionDTO> {
        return staticPermissionService.listSubjectPermissions(subjectId.toLong(), subjectType, page, size)
            .toPageResult()
    }

    @SchemaMapping
    fun allBoundPermissions(
        @Argument subjectId: String,
        @Argument subjectType: SubjectType,
        @Argument resource: String
    ): List<StaticPermissionDTO> {
        return staticPermissionService.listAllSubjectPermissions(subjectId.toLong(), subjectType, resource)
    }

    /**
     * 列出资源下所有的权限
     */
    @SchemaMapping
    fun listPermissionsByResource(@Argument resource: String): Set<PermissionEntity> {
        return staticPermissionService.findPermissionsByResourceName(resource)
    }

}