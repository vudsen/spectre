package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.perm.PolicyPermissionContext
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.policy.PolicyPermissionContextExample


/**
 * 安全服务.
 *
 * 系统有两种鉴权方式：
 * - ABAC: 主要围绕运行节点进行鉴权，如展开节点树，attach 时可以使用的命令
 * - ACL: 主要用于基础的菜单权限
 */
interface AppAccessControlService {

    /**
     * 通过 acl 校验当前用户是否可以访问该资源
     */
    fun isAccessibleByAcl(userId: Long, permissionEntity: PermissionEntity): Boolean

    /**
     * 获取用于帮助编写 ognl 表达式的样例
     */
    fun resolveExamplePolicyPermissionContext(permissionEntity: PermissionEntity): List<PolicyPermissionContextExample>


    /**
     * 通过 abac 校验当前用户是否可以访问该资源
     * @param context 上下文
     */
    fun checkPolicyPermission(
        context: PolicyPermissionContext
    )

}