package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.perm.PolicyPermissionContext
import io.github.vudsen.spectre.api.perm.PolicyPermissions
import io.github.vudsen.spectre.api.plugin.rnode.Jvm

/**
 * 当执行命令时使用
 */
class ArthasExecutionPolicyPermissionContext(
    val commands: List<String>,
    val runtimeNodeDTO: RuntimeNodeDTO,
    val jvm: Jvm
) : PolicyPermissionContext(PolicyPermissions.RUNTIME_NODE_ARTHAS_EXECUTE)