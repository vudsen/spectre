package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import reactor.core.publisher.Flux

interface AiService {

    /**
     * 询问 AI
     */
    fun query(conversationId: String, channelId: String, question: String): Flux<AiMessageDTO>

    fun getCurrentLLMConfiguration(): LLMConfigurationDTO?

    fun saveLLMConfiguration(configuration: LLMConfigurationDTO): LLMConfigurationDTO

}
