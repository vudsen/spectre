package io.github.vudsen.spectre.support.plugin

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.perm.PolicyPermissionContext
import io.github.vudsen.spectre.api.plugin.policy.PolicyAuthenticationProvider

class PolicyAuthenticationProviderManager(
    providers: List<PolicyAuthenticationProvider>,
) {
    private val providerMap = mutableMapOf<PermissionEntity, PolicyAuthenticationProvider>()

    init {
        for (provider in providers) {
            val old = providerMap[provider.getPermissionEntity()]
            if (old != null) {
                throw IllegalStateException("Duplicate provider, context class: " + provider.getPermissionEntity())
            }
            providerMap[provider.getPermissionEntity()] = provider
        }
    }

    fun findByContext(context: PolicyPermissionContext): PolicyAuthenticationProvider =
        providerMap[context.resource] ?: throw BusinessException("Permission not found")

    fun findByPermissionEntity(entity: PermissionEntity): PolicyAuthenticationProvider? = providerMap[entity]
}
