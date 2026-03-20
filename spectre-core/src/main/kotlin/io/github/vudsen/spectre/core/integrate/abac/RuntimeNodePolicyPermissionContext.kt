package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.perm.PolicyPermissionContext

class RuntimeNodePolicyPermissionContext(
    val runtimeNode: RuntimeNodeDTO,
    resource: PermissionEntity,
) : PolicyPermissionContext(resource)
