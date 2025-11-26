package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.core.bean.PageResult
import io.github.vudsen.spectre.core.bean.toPageResult
import io.github.vudsen.spectre.api.dto.UserDTO
import io.github.vudsen.spectre.api.service.UserService
import io.github.vudsen.spectre.repo.po.UserPO
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller

@Controller
@SchemaMapping(typeName = "UserQueries")
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).USER_READ)")
class UserQueriesController(
    private val userService: UserService
) {

    object UserQueries

    @QueryMapping
    fun user(): UserQueries {
        return UserQueries
    }

    @SchemaMapping
    fun users(@Argument page: Int, @Argument size: Int): PageResult<UserPO> {
        return userService.listUsers(page, size).toPageResult()
    }

    @SchemaMapping
    fun searchByUsername(@Argument username: String): PageResult<UserPO> {
        return userService.searchByUsernamePrefix(username).toPageResult()
    }

    @SchemaMapping
    fun user(@Argument id: String): UserDTO? {
        return userService.findById(id.toLong())
    }

}