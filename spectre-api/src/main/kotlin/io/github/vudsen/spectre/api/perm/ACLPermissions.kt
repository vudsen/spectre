package io.github.vudsen.spectre.api.perm

object ACLPermissions : BasePermissionsHolder() {

    @JvmStatic
    val ALL = PermissionEntity("all", "all", "所有权限")

    @JvmStatic
    val RUNTIME_NODE_READ = PermissionEntity("runtime-node", "read", "查看运行节点")

    @JvmStatic
    val RUNTIME_NODE_CREATE = PermissionEntity("runtime-node", "create", "创建运行节点")

    @JvmStatic
    val RUNTIME_NODE_UPDATE = PermissionEntity("runtime-node", "update", "更新运行节点")

    @JvmStatic
    val RUNTIME_NODE_DELETE = PermissionEntity("runtime-node", "delete", "删除运行节点")

    @JvmStatic
    val TOOL_CHAIN_READ = PermissionEntity("tool-chain", "read", "查询工具链")

    @JvmStatic
    val TOOL_CHAIN_CREATE = PermissionEntity("tool-chain", "create", "创建工具链")

    @JvmStatic
    val TOOL_CHAIN_UPDATE = PermissionEntity("tool-chain", "update", "更新工具链")

    @JvmStatic
    val TOOL_CHAIN_DELETE = PermissionEntity("tool-chain", "delete", "删除工具链")

    @JvmStatic
    val TOOL_CHAIN_BUNDLE_READ = PermissionEntity("tool-chain-bundle", "read", "查询工具包")

    @JvmStatic
    val TOOL_CHAIN_BUNDLE_CREATE = PermissionEntity("tool-chain-bundle", "create", "创建工具包")

    @JvmStatic
    val TOOL_CHAIN_BUNDLE_UPDATE = PermissionEntity("tool-chain-bundle", "update", "更新工具包")

    @JvmStatic
    val TOOL_CHAIN_BUNDLE_DELETE = PermissionEntity("tool-chain-bundle", "delete", "删除工具包")

    @JvmStatic
    val USER_READ = PermissionEntity("user", "read", "查询用户")

    @JvmStatic
    val USER_CREATE = PermissionEntity("user", "create", "创建用户")

    @JvmStatic
    val USER_UPDATE = PermissionEntity("user", "update", "更新用户")

    @JvmStatic
    val MODIFY_USER_PASSWORD = PermissionEntity("user", "modify-password", "更新用户")

    @JvmStatic
    val USER_DELETE = PermissionEntity("user", "delete", "删除用户")

    @JvmStatic
    val ROLE_READ = PermissionEntity("role", "read", "查询角色")

    @JvmStatic
    val ROLE_CREATE = PermissionEntity("role", "create", "创建角色")

    @JvmStatic
    val ROLE_DELETE = PermissionEntity("role", "delete", "删除角色")

    @JvmStatic
    val ROLE_UPDATE = PermissionEntity("role", "update", "更新角色")

    @JvmStatic
    val ROLE_BIND_USER = PermissionEntity("role", "bind:user", "绑定用户")

    @JvmStatic
    val PERMISSION_BIND = PermissionEntity("permission", "bind", "绑定权限")

    @JvmStatic
    val PERMISSION_READ = PermissionEntity("permission", "read", "查询权限")

    @JvmStatic
    val AUDIT_READ = PermissionEntity("audit", "read", "查询日志")


    init {
        registerPermission(ALL)
        registerPermission(RUNTIME_NODE_READ)
        registerPermission(RUNTIME_NODE_CREATE)
        registerPermission(RUNTIME_NODE_UPDATE)
        registerPermission(RUNTIME_NODE_DELETE)
        registerPermission(TOOL_CHAIN_READ)
        registerPermission(TOOL_CHAIN_CREATE)
        registerPermission(TOOL_CHAIN_UPDATE)
        registerPermission(TOOL_CHAIN_DELETE)
        registerPermission(TOOL_CHAIN_BUNDLE_READ)
        registerPermission(TOOL_CHAIN_BUNDLE_CREATE)
        registerPermission(TOOL_CHAIN_BUNDLE_UPDATE)
        registerPermission(TOOL_CHAIN_BUNDLE_DELETE)
        registerPermission(USER_READ)
        registerPermission(USER_CREATE)
        registerPermission(USER_UPDATE)
        registerPermission(USER_DELETE)
        registerPermission(ROLE_READ)
        registerPermission(ROLE_CREATE)
        registerPermission(ROLE_DELETE)
        registerPermission(ROLE_UPDATE)
        registerPermission(ROLE_BIND_USER)
        registerPermission(PERMISSION_BIND)
        registerPermission(PERMISSION_READ)
        registerPermission(AUDIT_READ)

        registerName("all", "所有权限")
        registerName("runtime-node", "运行节点")
        registerName("tool-chain", "工具链")
        registerName("tool-chain-bundle", "工具包")
        registerName("user", "用户")
        registerName("role", "角色")
        registerName("audit", "审计")
        registerName("permission", "权限")
    }

}