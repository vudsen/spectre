package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.api.plugin.EnhancePolicyAuthenticationExtensionPoint
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.policy.PolicyAuthenticationProvider
import io.github.vudsen.spectre.support.plugin.PolicyAuthenticationExtManager
import io.github.vudsen.spectre.support.plugin.PolicyAuthenticationProviderManager
import io.github.vudsen.spectre.support.plugin.RuntimeNodeExtManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class PluginConfiguration {
    @Bean
    fun runtimeNodeExtensionManager(extensions: List<RuntimeNodeExtensionPoint>): RuntimeNodeExtManager = RuntimeNodeExtManager(extensions)

    @Bean
    fun policyAuthenticationExtManager(extensions: List<EnhancePolicyAuthenticationExtensionPoint>): PolicyAuthenticationExtManager =
        PolicyAuthenticationExtManager(extensions)

    @Bean
    fun policyAuthenticationProviderManager(providers: List<PolicyAuthenticationProvider>): PolicyAuthenticationProviderManager =
        PolicyAuthenticationProviderManager(providers)
}
