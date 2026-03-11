package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import reactor.core.publisher.Flux

interface AiService {

    fun query(conversationId: String, channelId: String, question: String): Flux<AiMessageDTO>

}
