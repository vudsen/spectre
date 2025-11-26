package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.perm.ABACContext
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.perm.PermissionEntity

class ArthasExecutionABACContext(
    entity: PermissionEntity,
    val command: String,
    val runtimeNodeDTO: RuntimeNodeDTO,
    val jvm: Jvm
) : ABACContext(entity)