package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.common.plugin.PolicyAuthenticationExtManager
import io.github.vudsen.spectre.common.plugin.RuntimeNodeExtManager
import io.github.vudsen.spectre.api.plugin.PolicyAuthenticationExtensionPoint
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class PluginConfiguration {

    @Bean
    fun runtimeNodeExtensionManager(extensions: List<RuntimeNodeExtensionPoint>): RuntimeNodeExtManager {
        return RuntimeNodeExtManager(extensions)
    }

    @Bean
    fun policyAuthenticationExtManager(extensions: List<PolicyAuthenticationExtensionPoint>): PolicyAuthenticationExtManager {
        return PolicyAuthenticationExtManager(extensions)
    }

}