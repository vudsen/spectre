package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.api.service.LLMConfigurationService
import io.github.vudsen.spectre.core.service.ai.AiConversationStateStore
import io.github.vudsen.spectre.core.service.ai.AiSkillsLoader
import io.github.vudsen.spectre.core.service.ai.AiToolCallContextHolder
import io.github.vudsen.spectre.core.service.ai.AskHumanInterruptedException
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.openai.OpenAiChatModel
import org.springframework.ai.openai.api.OpenAiApi
import org.springframework.ai.openai.OpenAiChatOptions
import org.springframework.ai.tool.ToolCallback
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux

@Service
class DefaultAiService(
    private val chatClientBuilder: ChatClient.Builder,
    private val llmConfigurationService: LLMConfigurationService,
    private val aiConversationStateStore: AiConversationStateStore,
    private val aiSkillsLoader: AiSkillsLoader,
    private val aiToolCallContextHolder: AiToolCallContextHolder,
    private val toolCallbacks: List<ToolCallback>,
) : AiService {

    companion object {
        private val logger = LoggerFactory.getLogger(DefaultAiService::class.java)
    }

    override fun query(
        conversationId: String,
        channelId: String,
        question: String
    ): Flux<AiMessageDTO> {
        return Flux.create { sink ->
            val llmConfig = llmConfigurationService.getCurrent()
            if (llmConfig == null) {
                sink.next(AiMessageDTO(AiMessageDTO.MessageType.ERROR, "No enabled LLM configuration found"))
                sink.complete()
                return@create
            }

            aiConversationStateStore.bindChannel(conversationId, channelId)

            val pendingAskHuman = aiConversationStateStore.takePendingAskHuman(conversationId)
            val userPrompt = if (pendingAskHuman == null) {
                question
            } else {
                "The user has provided a response for your previous askHuman tool call. User response: ${question}"
            }

            val skillsPrompt = if (pendingAskHuman == null) {
                aiSkillsLoader.buildSkillsPrompt()
            } else {
                ""
            }

            val systemPrompt = buildString {
                appendLine("You are an Arthas troubleshooting assistant.")
                appendLine("Use available tools only when needed.")
                appendLine("Current LLM provider: ${llmConfig.provider}, model: ${llmConfig.model}")
                if (skillsPrompt.isNotBlank()) {
                    appendLine()
                    append(skillsPrompt)
                }
            }

            aiToolCallContextHolder.open(conversationId, channelId, SecurityContextHolder.getContext())
            try {
                val chatClient = buildChatClient(llmConfig)
                val content = chatClient
                    .prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .tools(toolCallbacks)
                    .call()
                    .content()

                aiToolCallContextHolder.snapshotMessages().forEach { sink.next(it) }

                if (!content.isNullOrBlank()) {
                    sink.next(AiMessageDTO(AiMessageDTO.MessageType.TOKEN, content))
                }
            } catch (_: AskHumanInterruptedException) {
                aiToolCallContextHolder.snapshotMessages().forEach { sink.next(it) }
            } catch (e: Exception) {
                logger.error("AI query failed", e)
                aiToolCallContextHolder.snapshotMessages().forEach { sink.next(it) }
                sink.next(AiMessageDTO(AiMessageDTO.MessageType.ERROR, e.message ?: "AI query failed"))
            } finally {
                aiToolCallContextHolder.clear()
                sink.complete()
            }
        }
    }

    private fun buildChatClient(llmConfig: LLMConfigurationDTO): ChatClient {
        if (!llmConfig.provider.equals("OPENAI", ignoreCase = true)) {
            return chatClientBuilder.build()
        }

        val apiKey = llmConfig.apiKey?.trim().orEmpty()
        if (apiKey.isBlank()) {
            return chatClientBuilder.build()
        }

        val openAiApi = OpenAiApi.builder()
            .apiKey(apiKey)
            .baseUrl(llmConfig.baseUrl?.trim()?.ifBlank { null })
            .build()

        val optionsBuilder = OpenAiChatOptions.builder()
        if (!llmConfig.model.isBlank()) {
            optionsBuilder.model(llmConfig.model)
        }

        val chatModel = OpenAiChatModel.builder()
            .openAiApi(openAiApi)
            .defaultOptions(optionsBuilder.build())
            .build()

        return ChatClient.builder(chatModel).build()
    }
}

