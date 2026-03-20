package io.github.vudsen.spectre.api.perm

import io.github.vudsen.spectre.api.dto.PermissionResourceDTO

open class BasePermissionsHolder {
    /**
     * [PermissionEntity.resource] => [PermissionEntity]
     */
    protected val permissionMap: MutableMap<String, MutableSet<PermissionEntity>> = mutableMapOf()

    protected val nameMap: MutableMap<String, String> = mutableMapOf()

    protected open fun registerPermission(entity: PermissionEntity) {
        permissionMap.compute(entity.resource) { k, list ->
            if (list == null) {
                return@compute mutableSetOf(entity)
            }
            if (!list.add(entity)) {
                throw IllegalStateException(
                    "Permission ${entity.resource}:${entity.action}(name: ${entity.name}) has already been registered.",
                )
            }
            return@compute list
        }
    }

    protected fun registerName(
        resource: String,
        name: String,
    ) {
        nameMap[resource] = name
    }

    protected fun resolveName(resource: String): String = nameMap[resource] ?: resource

    fun listPermissionResources(): List<PermissionResourceDTO> =
        permissionMap.entries.map { entry ->
            PermissionResourceDTO(
                resolveName(entry.key),
                entry.key,
            )
        }

    fun findPermissionsByResourceName(resource: String): Set<PermissionEntity> = permissionMap[resource] ?: emptySet()

    fun findByResourceAndActions(
        resource: String,
        action: String,
    ): PermissionEntity? {
        val res = permissionMap[resource] ?: return null
        return res.find { permissionEntity -> permissionEntity.resource == resource && permissionEntity.action == action }
    }
}
