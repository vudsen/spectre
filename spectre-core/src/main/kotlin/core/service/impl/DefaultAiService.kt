package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import io.github.vudsen.spectre.api.entity.SysConfigIds
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.core.service.ai.AiConversationStateStore
import io.github.vudsen.spectre.core.service.ai.AiSkillsLoader
import io.github.vudsen.spectre.core.service.ai.AiToolCallContextHolder
import io.github.vudsen.spectre.core.service.ai.AskHumanInterruptedException
import io.github.vudsen.spectre.core.service.ai.PendingConfirmInterruptedException
import io.github.vudsen.spectre.core.service.ai.PendingConfirmToolService
import io.github.vudsen.spectre.repo.SysConfigRepository
import io.github.vudsen.spectre.repo.po.SysConfigPO
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.openai.OpenAiChatModel
import org.springframework.ai.openai.OpenAiChatOptions
import org.springframework.ai.openai.api.OpenAiApi
import org.springframework.ai.tool.ToolCallback
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Flux
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultAiService(
    private val sysConfigRepository: SysConfigRepository,
    private val aiConversationStateStore: AiConversationStateStore,
    private val aiSkillsLoader: AiSkillsLoader,
    private val aiToolCallContextHolder: AiToolCallContextHolder,
    private val pendingConfirmToolService: PendingConfirmToolService,
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
            val llmConfig = getCurrentLLMConfiguration()
            if (llmConfig == null) {
                sink.next(AiMessageDTO(AiMessageDTO.MessageType.ERROR, "No enabled LLM configuration found"))
                sink.complete()
                return@create
            }

            aiConversationStateStore.bindChannel(conversationId, channelId)
            aiToolCallContextHolder.open(conversationId, channelId, SecurityContextHolder.getContext())

            try {
                upsertSystemMessage(conversationId, llmConfig)

                val pendingToolConfirm = aiConversationStateStore.takePendingToolConfirm(conversationId)
                if (pendingToolConfirm != null) {
                    handlePendingToolConfirm(conversationId, pendingToolConfirm, question)
                } else {
                    handleUserInput(conversationId, question)
                }

                val chatClient = buildChatClient(llmConfig)
                val content = chatClient
                    .prompt()
                    .messages(aiConversationStateStore.buildChatMessages(conversationId))
                    .tools(toolCallbacks)
                    .call()
                    .content()

                aiToolCallContextHolder.snapshotMessages().forEach { sink.next(it) }

                if (!content.isNullOrBlank()) {
                    aiConversationStateStore.appendAssistantTextMessage(conversationId, content)
                    sink.next(AiMessageDTO(AiMessageDTO.MessageType.TOKEN, content))
                }
            } catch (_: AskHumanInterruptedException) {
                aiToolCallContextHolder.snapshotMessages().forEach { sink.next(it) }
            } catch (_: PendingConfirmInterruptedException) {
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

    private fun upsertSystemMessage(conversationId: String, llmConfig: LLMConfigurationDTO) {
        val skillsPrompt = aiSkillsLoader.buildSkillsPrompt()
        val systemPrompt = buildString {
            appendLine("You are an Arthas troubleshooting assistant.")
            appendLine("Use available tools only when needed.")
            appendLine("Current LLM provider: ${llmConfig.provider}, model: ${llmConfig.model}")
            if (skillsPrompt.isNotBlank()) {
                appendLine()
                append(skillsPrompt)
            }
        }
        aiConversationStateStore.upsertSystemMessage(conversationId, systemPrompt)
    }

    private fun handleUserInput(conversationId: String, question: String) {
        aiConversationStateStore.takePendingAskHuman(conversationId)
        aiConversationStateStore.appendUserMessage(conversationId, question)
    }

    private fun handlePendingToolConfirm(
        conversationId: String,
        pending: AiConversationStateStore.PendingToolConfirmState,
        question: String,
    ) {
        val toolResponse = when (question) {
            "YES" -> pendingConfirmToolService.executePending(pending)
            "SKIP" -> pendingConfirmToolService.skipPending(pending)
            else -> {
                aiConversationStateStore.savePendingToolConfirm(
                    conversationId = conversationId,
                    toolCallId = pending.toolCallId,
                    toolName = pending.toolName,
                    toolArguments = pending.toolArguments,
                    parameter = pending.parameter,
                    channelId = pending.channelId,
                )
                throw IllegalArgumentException("Pending confirmation requires query to be exactly YES or SKIP")
            }
        }

        aiConversationStateStore.appendToolResponseMessage(
            conversationId = conversationId,
            toolCallId = pending.toolCallId,
            toolName = pending.toolName,
            responseData = toolResponse,
        )

        aiToolCallContextHolder.emit(
            AiMessageDTO.MessageType.TOOL_CALL_END,
            pending.toolName,
            pending.parameter
        )
    }

    override fun getCurrentLLMConfiguration(): LLMConfigurationDTO? {
        val enabled = findConfigValue(SysConfigIds.LLM_ENABLED).toBoolean()
        if (!enabled) {
            return null
        }

        return LLMConfigurationDTO(
            provider = findConfigValue(SysConfigIds.LLM_PROVIDER).ifBlank { "OPENAI" },
            model = findConfigValue(SysConfigIds.LLM_MODEL),
            baseUrl = findNullableConfigValue(SysConfigIds.LLM_BASE_URL),
            apiKey = findNullableConfigValue(SysConfigIds.LLM_API_KEY),
            enabled = true,
        )
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun saveLLMConfiguration(configuration: LLMConfigurationDTO): LLMConfigurationDTO {
        val provider = configuration.provider.trim().ifBlank { "OPENAI" }
        val model = configuration.model.trim()
        val baseUrl = configuration.baseUrl?.trim()?.ifBlank { null }
        val apiKey = configuration.apiKey?.trim()?.ifBlank { null }

        upsertConfig(SysConfigIds.LLM_PROVIDER, "llm.provider", provider)
        upsertConfig(SysConfigIds.LLM_MODEL, "llm.model", model)
        upsertConfig(SysConfigIds.LLM_BASE_URL, "llm.base-url", baseUrl.orEmpty())
        upsertConfig(SysConfigIds.LLM_API_KEY, "llm.api-key", apiKey.orEmpty())
        upsertConfig(SysConfigIds.LLM_ENABLED, "llm.enabled", configuration.enabled.toString())

        return LLMConfigurationDTO(
            provider = provider,
            model = model,
            baseUrl = baseUrl,
            apiKey = apiKey,
            enabled = configuration.enabled,
        )
    }

    private fun buildChatClient(llmConfig: LLMConfigurationDTO): ChatClient {
        if (!llmConfig.provider.equals("OPENAI", ignoreCase = true)) {
            throw IllegalStateException("Only OPENAI provider is supported")
        }

        val apiKey = llmConfig.apiKey?.trim().orEmpty()
        if (apiKey.isBlank()) {
            throw IllegalStateException("LLM apiKey is required")
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

    private fun findConfigValue(id: Long): String {
        return sysConfigRepository.findById(id).getOrNull()?.value?.trim().orEmpty()
    }

    private fun findNullableConfigValue(id: Long): String? {
        return findConfigValue(id).ifBlank { null }
    }

    private fun upsertConfig(id: Long, code: String, value: String) {
        val po = sysConfigRepository.findById(id).getOrNull() ?: SysConfigPO().apply {
            this.id = id
            this.code = code
        }

        if (po.code.isNullOrBlank()) {
            po.code = code
        }
        po.value = value

        sysConfigRepository.save(po)
    }
}
