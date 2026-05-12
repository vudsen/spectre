package io.github.vudsen.spectre.core.integrate.ai

import io.github.vudsen.spectre.api.AgentEventPublisher
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO

data class AiQueryContext(
    val conversationId: String,
    val channelId: String,
    val publisher: AgentEventPublisher,
    val llmConfig: LLMConfigurationDTO,
)
