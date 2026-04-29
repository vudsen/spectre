package io.github.vudsen.spectre.core.configuration

import org.springframework.ai.chat.memory.ChatMemory
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository
import org.springframework.ai.chat.memory.MessageWindowChatMemory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SpringAiConfiguration {
    @Bean
    fun chatMemory(): ChatMemory =
        MessageWindowChatMemory
            .builder()
            .chatMemoryRepository(InMemoryChatMemoryRepository())
            .maxMessages(200)
            .build()
}
