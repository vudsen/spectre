package io.github.vudsen.spectre.api.perm

object PolicyPermissions : BasePermissionsHolder() {

    @JvmStatic
    val RUNTIME_NODE_TREE_EXPAND = PermissionEntity("runtime_node", "tree", "展开节点树")

    @JvmStatic
    val RUNTIME_NODE_ATTACH = PermissionEntity("runtime_node", "attach", "连接节点")

    val RUNTIME_NODE_ARTHAS_EXECUTE = PermissionEntity("runtime_node", "execute", "执行 Arthas 命令")

    private val allPermissions = mutableSetOf<PermissionEntity>()

    override fun registerPermission(entity: PermissionEntity) {
        super.registerPermission(entity)
        allPermissions.add(entity)
    }

    init {
        registerPermission(RUNTIME_NODE_TREE_EXPAND)
        registerPermission(RUNTIME_NODE_ATTACH)
        registerPermission(RUNTIME_NODE_ARTHAS_EXECUTE)

        registerName("runtime_node", "运行节点")
    }


    fun listAllPermissions(): Set<PermissionEntity> {
        return allPermissions
    }
}