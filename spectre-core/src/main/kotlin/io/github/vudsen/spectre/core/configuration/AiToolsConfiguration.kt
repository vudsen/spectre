package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.api.ai.AgentTool
import io.github.vudsen.spectre.core.integrate.ai.AgentToolsManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class AiToolsConfiguration {
    @Bean
    fun toolManager(tools: List<AgentTool>): AgentToolsManager = AgentToolsManager(tools)
}
