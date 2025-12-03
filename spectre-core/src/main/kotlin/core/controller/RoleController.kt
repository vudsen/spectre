package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.api.service.RoleService
import io.github.vudsen.spectre.core.vo.RoleBindUserRequestVO
import io.github.vudsen.spectre.repo.po.RolePO
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
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).ROLE_READ)")
class RoleController(
    private val roleService: RoleService
) {


    @PostMapping("bind-user")
    @Log(messageKey = "log.role.bind", contextResolveExp = "#args[0]")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).ROLE_BIND_USER)")
    fun bindUser(@Validated @RequestBody vo: RoleBindUserRequestVO) {
        roleService.bindUser(vo.roleId.toLong(), vo.userIds.map { uidStr -> uidStr.toLong() })
    }

    @Log(messageKey = "log.role.create", contextResolveExp = "{ id: #args[0].id, name: #args[0].name }")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).ROLE_CREATE)")
    @PostMapping("create")
    fun createRole(@Validated(CreateGroup::class) @RequestBody role: RolePO) {
        roleService.saveRole(role)
    }

    @Log(messageKey = "log.role.update", contextResolveExp = "{ id: #args[0].id, name: #args[0].name }")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).ROLE_UPDATE)")
    @PostMapping("update")
    fun updateRole(@Validated(UpdateGroup::class) @RequestBody role: RolePO) {
        roleService.saveRole(role)
    }

}