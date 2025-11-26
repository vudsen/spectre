package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.perm.ABACContext
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode

class AttachNodeABACContext(
    permissionEntity: PermissionEntity,
    val runtimeNode: RuntimeNodeDTO,
    val node: JvmSearchNode<*>
) : ABACContext(permissionEntity)