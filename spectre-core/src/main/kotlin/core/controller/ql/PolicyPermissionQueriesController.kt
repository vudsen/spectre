package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.core.bean.PageResult
import io.github.vudsen.spectre.core.bean.toPageResult
import io.github.vudsen.spectre.api.dto.PolicyPermissionDTO
import io.github.vudsen.spectre.api.service.PolicyPermissionService
import io.github.vudsen.spectre.repo.entity.SubjectType
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller

@Controller
@SchemaMapping(typeName = "PolicyPermissionQueries")
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).PERMISSION_READ)")
class PolicyPermissionQueriesController(
    private val policyPermissionService: PolicyPermissionService
) {

    object PolicyPermissionQueries

    @QueryMapping
    fun policyPermission(): PolicyPermissionQueries {
        return PolicyPermissionQueries
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
    ): PageResult<PolicyPermissionDTO> {
        return policyPermissionService.listSubjectPermissions(subjectId.toLong(), subjectType, page, size)
            .toPageResult()
    }

    @SchemaMapping
    fun permission(@Argument id: Long): PolicyPermissionDTO? {
        return policyPermissionService.findById(id)
    }

}