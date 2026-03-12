package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import io.github.vudsen.spectre.api.dto.SkillDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.entity.SysConfigIds
import io.github.vudsen.spectre.api.exception.AppException
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

            aiToolCallContextHolder.open(conversationId, channelId, SecurityContextHolder.getContext())

            try {
                upsertSystemMessage(conversationId, llmConfig, question)

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
                val hasToolCall = aiToolCallContextHolder.snapshotMessages()
                    .any { it.type == AiMessageDTO.MessageType.TOOL_CALL_START }
                if (!hasToolCall) {
                    aiConversationStateStore.clearSelectedSkill(conversationId)
                }
                aiToolCallContextHolder.clear()
                sink.complete()
            }
        }
    }

    private fun upsertSystemMessage(conversationId: String, llmConfig: LLMConfigurationDTO, question: String) {
        val selectedSkillName = resolveSelectedSkill(conversationId, llmConfig, question)
        val selectedSkillContent = selectedSkillName?.let { aiSkillsLoader.loadSkill(it) }

        val systemPrompt = buildString {
            appendLine("You are an Arthas troubleshooting assistant.")
            appendLine("Use available tools only when needed.")
            appendLine("Current LLM provider: ${llmConfig.provider}, model: ${llmConfig.model}")
            if (!selectedSkillName.isNullOrBlank() && !selectedSkillContent.isNullOrBlank()) {
                appendLine()
                appendLine("Selected skill: $selectedSkillName")
                appendLine(selectedSkillContent)
            }
        }
        aiConversationStateStore.upsertSystemMessage(conversationId, systemPrompt)
    }

    private fun resolveSelectedSkill(
        conversationId: String,
        llmConfig: LLMConfigurationDTO,
        question: String,
    ): String? {
        val cachedSkill = aiConversationStateStore.getSelectedSkill(conversationId)
        if (!cachedSkill.isNullOrBlank()) {
            return cachedSkill
        }

        val skills = aiSkillsLoader.loadAllSkills()
        if (skills.isEmpty()) {
            return null
        }

        val selected = selectSkillWithLLM(llmConfig, question, skills)
        if (skills.none { it.name == selected }) {
            throw AppException("Invalid skill selected by LLM: $selected")
        }

        aiConversationStateStore.saveSelectedSkill(conversationId, selected)
        return selected
    }

    private fun selectSkillWithLLM(
        llmConfig: LLMConfigurationDTO,
        question: String,
        skills: List<SkillDTO>
    ): String {
        val skillList = skills.joinToString("\n") { "- ${it.name}: ${it.description}" }

        val rawSelection = buildChatClient(llmConfig)
            .prompt()
            .system(
                """
                You are choosing one troubleshooting skill for the next response.
                Choose exactly one skill name from the provided list.
                Return only the skill name. Do not add any other text.
                
                Available skills:
                $skillList
                """.trimIndent()
            )
            .user(question)
            .call()
            .content()
            ?.trim()
            .orEmpty()

        val normalized = normalizeSkillName(rawSelection)
        if (normalized.isBlank()) {
            throw IllegalStateException("Skill selection result is empty")
        }
        return normalized
    }

    private fun normalizeSkillName(raw: String): String {
        val firstContentLine = raw.lineSequence()
            .map { it.trim() }
            .firstOrNull { it.isNotBlank() && it != "```" && !it.startsWith("```") }
            .orEmpty()

        val maybeNameLine = if (firstContentLine.startsWith("name:", ignoreCase = true)) {
            firstContentLine.substringAfter(':').trim()
        } else {
            firstContentLine
        }

        return maybeNameLine.trim().trim('"', '\'', '`')
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
            baseUrl = findConfigValue(SysConfigIds.LLM_BASE_URL),
            apiKey = findConfigValue(SysConfigIds.LLM_API_KEY),
            maxTokenPerHour = findConfigValue(SysConfigIds.LLM_MAX_TOKEN_PER_HOUR).toLongOrNull() ?: -1,
            enabled = true,
        )
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun updateLLMConfiguration(configuration: UpdateLLMConfigurationDTO) {
        configuration.baseUrl?.let {
            sysConfigRepository.updateValueById(SysConfigIds.LLM_BASE_URL, it)
        }
        configuration.apiKey?.let {
            sysConfigRepository.updateValueById(SysConfigIds.LLM_API_KEY, it)
        }
        configuration.enabled?.let {
            sysConfigRepository.updateValueById(SysConfigIds.LLM_ENABLED, it.toString())
        }
        configuration.model?.let {
            sysConfigRepository.updateValueById(SysConfigIds.LLM_MODEL, it)
        }
        configuration.maxTokenPerHour?.let {
            sysConfigRepository.updateValueById(SysConfigIds.LLM_MAX_TOKEN_PER_HOUR, it.toString())
        }
    }

    private fun buildChatClient(llmConfig: LLMConfigurationDTO): ChatClient {
        if (!llmConfig.provider.equals("OPENAI", ignoreCase = true)) {
            throw IllegalStateException("Only OPENAI provider is supported")
        }

        val apiKey = llmConfig.apiKey
        if (apiKey.isBlank()) {
            throw IllegalStateException("LLM apiKey is required")
        }

        val openAiApi = OpenAiApi.builder()
            .apiKey(apiKey)
            .baseUrl(llmConfig.baseUrl)
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
        return sysConfigRepository.findById(id).getOrNull()?.value.orEmpty()
    }

}
