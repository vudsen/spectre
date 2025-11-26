package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.perm.ABACContext
import io.github.vudsen.spectre.api.perm.PermissionEntity

class RuntimeNodeABACContext(val runtimeNode: RuntimeNodeDTO, resource: PermissionEntity): ABACContext(resource)