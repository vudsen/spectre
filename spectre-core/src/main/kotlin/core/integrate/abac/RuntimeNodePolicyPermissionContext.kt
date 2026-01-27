package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.perm.PolicyPermissionContext
import io.github.vudsen.spectre.api.perm.PermissionEntity

class RuntimeNodePolicyPermissionContext(val runtimeNode: RuntimeNodeDTO, resource: PermissionEntity): PolicyPermissionContext(resource)