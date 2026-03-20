package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.api.service.RoleService
import io.github.vudsen.spectre.core.bean.PageResult
import io.github.vudsen.spectre.core.bean.toPageResult
import io.github.vudsen.spectre.repo.po.RolePO
import io.github.vudsen.spectre.repo.po.UserPO
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller

@Controller
@SchemaMapping(typeName = "RoleQueries")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).ROLE_READ)")
class RoleQueriesController(
    private val roleService: RoleService,
) {
    object RoleQueries

    @QueryMapping
    fun role(): RoleQueries = RoleQueries

    @SchemaMapping(typeName = "RoleQueries", field = "roles")
    fun roles(
        @Argument page: Int,
        @Argument size: Int,
    ): PageResult<RolePO> = roleService.listRoles(page, size).toPageResult()

    @SchemaMapping(typeName = "RoleQueries", field = "role")
    fun role(
        @Argument id: String,
    ): RolePO? = roleService.findById(id.toLong())

    @SchemaMapping(typeName = "RoleQueries", field = "boundUsers")
    fun boundUsers(
        @Argument roleId: Long,
        @Argument page: Int,
        @Argument size: Int,
    ): PageResult<UserPO> = roleService.boundUsers(roleId, page, size).toPageResult()

    @SchemaMapping(typeName = "RoleQueries", field = "userRoles")
    fun userRoles(
        @Argument userId: Long,
    ): List<RolePO> = roleService.listUserRoles(userId)

    @SchemaMapping(typeName = "RoleQueries", field = "searchRoleByName")
    fun searchRoleByName(
        @Argument name: String,
    ): PageResult<RolePO> = roleService.searchByName(name, 0, 10).toPageResult()
}
