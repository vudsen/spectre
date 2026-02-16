package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.api.service.RoleService
import io.github.vudsen.spectre.core.vo.RoleBindUserRequestVO
import io.github.vudsen.spectre.core.vo.RoleBindVO
import io.github.vudsen.spectre.repo.po.RolePO
import io.github.vudsen.spectre.repo.po.UserRolePO
import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.repo.util.UpdateGroup
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("role")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).ROLE_READ)")
class RoleController(
    private val roleService: RoleService
) {

    private fun toLongList(list: List<String>) = list.map { it.toLong() }

    @PostMapping("bind-user")
    @Log(messageKey = "log.role.bind", contextResolveExp = "#args[0]")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).ROLE_BIND_USER)")
    fun bindUser(@Validated @RequestBody vo: RoleBindUserRequestVO) {
        roleService.bindUser(toLongList(vo.roleIds), toLongList(vo.userIds))
    }

    @Log(messageKey = "log.role.create", contextResolveExp = "{ id: #args[0].id, name: #args[0].name }")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).ROLE_CREATE)")
    @PostMapping("create")
    fun createRole(@Validated(CreateGroup::class) @RequestBody role: RolePO) {
        roleService.saveRole(role)
    }

    @Log(messageKey = "log.role.update", contextResolveExp = "{ id: #args[0].id, name: #args[0].name }")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).ROLE_UPDATE)")
    @PostMapping("update")
    fun updateRole(@Validated(UpdateGroup::class) @RequestBody role: RolePO) {
        roleService.saveRole(role)
    }

    @Log(messageKey = "log.role.unbind", contextResolveExp = "{ userId: #args[0].userId, roleId: #args[0].roleId }")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).ROLE_BIND_USER)")
    @PostMapping("unbind-user")
    fun unbindUser(@Validated @RequestBody vo: RoleBindVO) {
        roleService.unbindUser(vo.roleId.toLong(), vo.userId.toLong())
    }

}