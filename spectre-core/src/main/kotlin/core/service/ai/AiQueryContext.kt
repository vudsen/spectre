package io.github.vudsen.spectre.core.service.ai

import com.openai.client.OpenAIClient
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import org.springframework.security.core.context.SecurityContext
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

data class AiQueryContext(
    val conversationId: String,
    val channelId: String,
    val emitter: SseEmitter,
    val client: OpenAIClient,
    val securityContext: SecurityContext,
    val llmConfig: LLMConfigurationDTO,
)
