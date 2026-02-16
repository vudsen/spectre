package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.core.integrate.UserWithID
import io.github.vudsen.spectre.api.service.UserService
import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.repo.util.UpdateGroup
import io.github.vudsen.spectre.core.vo.ModifyPasswordVO
import io.github.vudsen.spectre.core.vo.ModifyUserPasswordVO
import io.github.vudsen.spectre.repo.po.UserPO
import jakarta.servlet.http.HttpServletRequest
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("user")
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.AppPermissions).USER_READ)")
class UserController(
    private val userService: UserService
) {

    @PostMapping("create")
    @Log(messageKey = "log.user.create", contextResolveExp = "{ username: #args[0].username }")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.AppPermissions).USER_CREATE)")
    fun createUser(@Validated(CreateGroup::class) @RequestBody po: UserPO) {
        userService.saveUser(po)
    }

    @PostMapping("update")
    @Log(messageKey = "log.user.update", contextResolveExp = "{ username: #args[0].username }")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.AppPermissions).USER_UPDATE)")
    fun updateUser(@Validated(UpdateGroup ::class) @RequestBody po: UserPO) {
        userService.saveUser(po)
    }

    @PostMapping("modify-user-password")
    @Log(messageKey = "log.user.modify_user_password")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.AppPermissions).MODIFY_USER_PASSWORD)")
    fun modifyPassword(@RequestBody @Validated vo: ModifyUserPasswordVO) {
        userService.modifyPassword(vo.userId.toLong(), vo.newPassword)
    }

    @PostMapping("modify-password")
    @Log(messageKey = "log.user.modify_password")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.AppPermissions).LOG_READ)")
    fun modifySelfPassword(@RequestBody @Validated vo: ModifyPasswordVO, request: HttpServletRequest) {
        val user = SecurityContextHolder.getContext().authentication!!.principal as UserWithID
        userService.modifyPassword(user.id, vo.oldPassword, vo.newPassword)
        SecurityContextHolder.clearContext()
        request.getSession(false)?.invalidate()
    }

}