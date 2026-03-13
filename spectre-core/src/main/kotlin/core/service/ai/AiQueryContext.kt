package io.github.vudsen.spectre.core.service.ai

import com.openai.client.OpenAIClient
import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import org.springframework.security.core.context.SecurityContext
import reactor.core.publisher.FluxSink

data class AiQueryContext(
    val conversationId: String,
    val channelId: String,
    val sink: FluxSink<AiMessageDTO>,
    val client: OpenAIClient,
    val securityContext: SecurityContext,
    val llmConfig: LLMConfigurationDTO,
)
