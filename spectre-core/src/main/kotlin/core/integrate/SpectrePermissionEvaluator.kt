package io.github.vudsen.spectre.core.integrate

import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.api.perm.PermissionEntity
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.expression.spel.standard.SpelExpressionParser
import org.springframework.security.access.PermissionEvaluator
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import java.io.Serializable

/**
 * 自定义鉴权.
 *
 * ## 使用 ACL 鉴权
 * 对于 ACL，可以直接使用下面的方法进行鉴权 (See [io.github.vudsen.spectre.api.perm.ACLPermissions])：
 * ```
 * @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).ROLE_BIND_USER)")
 * ```
 *
 * 在绑定上下文后，这里就会就会执行 SpEL 表达式来判断操作是否拥有权限。
 *
 * TIPS: **不需要手动清除绑定的上下文**
 */
@Component
class SpectrePermissionEvaluator: PermissionEvaluator {

    private lateinit var appAccessControlService: AppAccessControlService

    private val spELParser = SpelExpressionParser()

    @Autowired
    fun setAppAccessControlService(appAccessControlService: AppAccessControlService) {
        this.appAccessControlService = appAccessControlService
    }

    override fun hasPermission(
        authentication: Authentication,
        targetDomainObject: Any?,
        permission: Any
    ): Boolean {
        val user = authentication.principal as UserWithID
        if (permission is PermissionEntity) {
            return appAccessControlService.isAccessibleByAcl(user.id, permission)
        }
        TODO("Not yet implemented")
    }

    override fun hasPermission(
        authentication: Authentication,
        targetId: Serializable?,
        targetType: String,
        permission: Any
    ): Boolean {
        if (!authentication.isAuthenticated) {
            return false
        }
        TODO()
    }
}