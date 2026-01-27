package io.github.vudsen.spectre.api.perm

/**
 * 策略权限上下文
 */
abstract class PolicyPermissionContext(
    val resource: PermissionEntity
)