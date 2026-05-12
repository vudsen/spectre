package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.AgentEventPublisher
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import io.github.vudsen.spectre.api.dto.SkillDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.entity.Skill
import io.github.vudsen.spectre.api.entity.SysConfigIds
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.api.service.SysConfigService
import io.github.vudsen.spectre.api.vo.LLMConfigurationVO
import io.github.vudsen.spectre.core.integrate.ai.AiQueryContext
import io.github.vudsen.spectre.core.integrate.ai.AiSkillsLoader
import io.github.vudsen.spectre.core.integrate.ai.tool.AskHumanTool
import io.github.vudsen.spectre.core.integrate.ai.AgentToolsManager
import io.github.vudsen.spectre.core.integrate.ai.currentNotRespondedTool
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor
import org.springframework.ai.chat.memory.ChatMemory
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.messages.Message
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.ToolResponseMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.chat.model.ChatResponse
import org.springframework.ai.openai.OpenAiChatModel
import org.springframework.ai.openai.OpenAiChatOptions
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.Executor
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock
import kotlin.math.min

@Service
class DefaultAiService(
    private val sysConfigService: SysConfigService,
    private val agentToolsManager: AgentToolsManager,
    private val chatMemory: ChatMemory,
    private val messageSource: MessageSource,
) : AiService {
    private val executor: Executor =
        ThreadPoolExecutor(
            0,
            4,
            30,
            TimeUnit.MINUTES,
            ArrayBlockingQueue(32),
            { r -> Thread(r, "AI-SSE ${System.currentTimeMillis()}") },
        ) { _, _ -> throw BusinessException("error.system.busy") }

    companion object {
        private val logger = LoggerFactory.getLogger(DefaultAiService::class.java)
        private const val TOKEN_USAGE_UPDATE_MAX_RETRIES = 3
        private const val MILLIS_PER_HOUR = 1000L * 60 * 60
        private const val MAX_CONVERSATION_TOKEN = 100000L
    }

    private data class HourlyTokenUsage(
        val epochHour: Long,
        val used: Long,
    )

    private val tokenUsageLock = ReentrantLock()

    @Volatile
    private var cachedChatClient: ChatClient? = null

    @Volatile
    private var cachedLlmConfigHash: Int? = null

    private fun processConversationLoop(
        context: AiQueryContext,
        initialInputMessage: Message,
    ) {
        val maxIteration = 10
        var currentIteration = 0
        var nextInputMessage: Message? = initialInputMessage
        while (currentIteration < maxIteration) {
            currentIteration++
            val toolCalls =
                requestAssistantTurn(
                    context = context,
                    inputMessage = nextInputMessage ?: break,
                )
            nextInputMessage = null

            if (toolCalls.isEmpty()) {
                return
            }

            for (toolCall in toolCalls) {
                context.publisher.onToolCallStart(toolCall.name, toolCall.arguments)
                if (agentToolsManager.isRequireConfirm(toolCall.name)) {
                    context.publisher.sendPendingConfirm(toolCall.name, toolCall.arguments)
                    return
                } else if (toolCall.name == AskHumanTool.NAME) {
                    context.publisher.askHuman(toolCall.arguments)
                    return
                }

                val executionResult =
                    agentToolsManager.executeTool(
                        io.github.vudsen.spectre.api.ai
                            .AiToolExecutionContext(context.conversationId),
                        toolCall.name,
                        toolCall.arguments,
                    )

                nextInputMessage =
                    ToolResponseMessage
                        .builder()
                        .responses(listOf(ToolResponseMessage.ToolResponse(toolCall.id, toolCall.name, executionResult)))
                        .metadata(mapOf())
                        .build()
                context.publisher.onToolCallEnd(toolCall.name, executionResult)
                break
            }
        }
        if (currentIteration == maxIteration) {
            context.publisher.onError(null, "达到迭代次数")
        }
    }

    private fun requestAssistantTurn(
        context: AiQueryContext,
        inputMessage: Message,
    ): List<AssistantMessage.ToolCall> {
        ensureNotExceededTokenLimit(context.llmConfig.maxTokenPerHour)

        val chatClient = getOrCreateChatClient(context.llmConfig)
        val options =
            buildLlmOptions(context) {
                internalToolExecutionEnabled(false)
                toolCallbacks(agentToolsManager.toolCallbacks())
            }

        var latest: ChatResponse? = null
        val assistantMessageBuilder = StringBuilder()
        chatClient
            .prompt()
            .options(options)
            .messages(inputMessage)
            .advisors { spec ->
                spec.param(ChatMemory.CONVERSATION_ID, context.conversationId)
            }.stream()
            .chatResponse()
            .doOnNext { response ->
                latest = response
                val delta =
                    response.result
                        ?.output
                        ?.text
                        .orEmpty()
                if (delta.isNotEmpty()) {
                    assistantMessageBuilder.append(delta)
                    context.publisher.onMessage(delta)
                }
            }.blockLast()

        val finalResponse = latest ?: throw AppException("Empty completion from model")
        val assistantMessage = finalResponse.result!!.output

        val usedTokens =
            finalResponse.metadata.usage.totalTokens
                .toLong()
        recordTokenUsage(usedTokens)

        return assistantMessage.toolCalls
    }

    private fun recoverPendingConfirm(
        context: AiQueryContext,
        question: String,
        tool: AssistantMessage.ToolCall,
    ): ToolResponseMessage {
        val response =
            when (question) {
                "YES" -> {
                    agentToolsManager.executeTool(
                        io.github.vudsen.spectre.api.ai
                            .AiToolExecutionContext(context.channelId),
                        tool.name,
                        tool.arguments,
                    )
                }
                "NO" -> {
                    "User refuse to execute this command, please try another command or exit the process."
                }
                else -> {
                    throw IllegalArgumentException("Pending confirmation only accepts YES or NO")
                }
            }

        context.publisher.onToolCallEnd(tool.name, response)

        // TODO: 支持多工具调用?
        return ToolResponseMessage
            .builder()
            .responses(listOf(ToolResponseMessage.ToolResponse(tool.id, tool.name, response)))
            .build()
    }

    private fun buildSystemMessageWithSkill(
        context: AiQueryContext,
        questionForSkillSelection: String?,
        selectedSkillId: String?,
    ): String? {
        val selectedSkillName =
            selectedSkillId
                ?: resolveSelectedSkill(
                    context = context,
                    questionForSkillSelection = questionForSkillSelection,
                )
        if (selectedSkillName == null) return null

        val selectedSkillContent = AiSkillsLoader.loadSkill(selectedSkillName)
        return """
            You are a Java troubleshooting assistant responsible for diagnosing runtime problems in Java applications.

            You are allowed to run Arthas commands to collect runtime information and help the user analyze the issue.

            Use the following skill instructions:

            $selectedSkillContent
            """.trimIndent()
    }

    private fun buildSystemMessageWithoutSkill(): String =
        """
        You are a helpful Java troubleshooting assistant.
        You are allowed to run Arthas commands to collect runtime information.
        If required context is missing, use askHuman tool.
        """.trimIndent()

    private fun resolveSelectedSkill(
        context: AiQueryContext,
        questionForSkillSelection: String?,
    ): String? {
        val question = questionForSkillSelection?.trim().orEmpty()
        if (question.isBlank()) {
            return null
        }

        val skills = AiSkillsLoader.loadAllSkills()
        if (skills.isEmpty()) {
            return null
        }

        return selectSkillWithLlm(context, question, skills)
    }

    private fun selectSkillWithLlm(
        context: AiQueryContext,
        question: String,
        skills: List<Skill>,
    ): String? {
        ensureNotExceededTokenLimit(context.llmConfig.maxTokenPerHour)

        val skillList = skills.joinToString("\n") { "- ${it.name}: ${it.description}" }

        val selectionPrompt =
            """
            You are selecting one troubleshooting skill for an Arthas assistant.
            Choose exactly one skill name from the list below.
            Return ONLY the skill name. If no skill is suitable, return none.
            Skill list:
            $skillList
            """.trimIndent()

        val options =
            buildLlmOptions(context)
        val chatClient = getOrCreateChatClient(context.llmConfig)

        val response =
            chatClient
                .prompt(question)
                .system(selectionPrompt)
                .options(options)
                .call()
                .chatResponse()

        val content =
            response
                ?.result
                ?.output
                ?.text
                .orEmpty()
                .trim()

        val usedTokens =
            response
                ?.metadata
                ?.usage
                ?.totalTokens
                ?.toLong() ?: 0

        recordTokenUsage(usedTokens)
        val normalized = normalizeSkillSelection(content)
        if (normalized.isBlank() || normalized.equals("none", ignoreCase = true)) {
            return null
        }

        return skills.firstOrNull { it.name.equals(normalized, ignoreCase = true) }?.name
    }

    private fun buildLlmOptions(
        context: AiQueryContext,
        customise: (OpenAiChatOptions.Builder.() -> Unit)? = null,
    ): OpenAiChatOptions.Builder {
        // Disable thinking.
        val extraBody: Map<String, Any>? =
            when (context.llmConfig.model) {
                "deepseek-v4-flash", "deepseek-v4-pro" ->
                    mapOf(
                        "thinking" to
                            mapOf(
                                "type" to "disabled",
                            ),
                    )

                else -> null
            }
        val optionsBuilder =
            OpenAiChatOptions
                .builder()
                .model(context.llmConfig.model)
                .maxTokens(
                    if (context.llmConfig.maxTokenPerHour > 0) {
                        min(context.llmConfig.maxTokenPerHour, MAX_CONVERSATION_TOKEN).toInt()
                    } else {
                        MAX_CONVERSATION_TOKEN.toInt()
                    },
                )
        extraBody?.let {
            optionsBuilder.extraBody(it)
        }
        customise?.let {
            customise(optionsBuilder)
        }
        return optionsBuilder
    }

    private fun normalizeSkillSelection(raw: String): String {
        val firstLine =
            raw
                .lineSequence()
                .map { it.trim() }
                .firstOrNull { it.isNotBlank() && !it.startsWith("```") }
                .orEmpty()

        val candidate =
            if (firstLine.startsWith("name:", ignoreCase = true)) {
                firstLine.substringAfter(':').trim()
            } else {
                firstLine
            }

        return candidate.trim('"', '\'', '`')
    }

    private fun ensureNotExceededTokenLimit(maxTokenPerHour: Long) {
        if (maxTokenPerHour == -1L) {
            return
        }
        val currentEpochHour = System.currentTimeMillis() / MILLIS_PER_HOUR
        tokenUsageLock.withLock {
            val rawValue = findConfigValue(SysConfigIds.LLM_USED)
            val usage = parseHourlyTokenUsage(rawValue)
            val usedInCurrentHour =
                if (usage.epochHour == currentEpochHour) {
                    usage.used
                } else {
                    0L
                }
            if (usedInCurrentHour >= maxTokenPerHour) {
                throw BusinessException("error.llm.token.hourly.limit.exceeded")
            }
        }
    }

    private fun recordTokenUsage(delta: Long) {
        if (delta <= 0) {
            return
        }
        val currentEpochHour = System.currentTimeMillis() / MILLIS_PER_HOUR
        tokenUsageLock.withLock {
            repeat(TOKEN_USAGE_UPDATE_MAX_RETRIES) {
                val oldValue = findConfigValue(SysConfigIds.LLM_USED)
                val oldUsage = parseHourlyTokenUsage(oldValue)
                val baseUsed =
                    if (oldUsage.epochHour == currentEpochHour) {
                        oldUsage.used
                    } else {
                        0L
                    }
                val newUsed = baseUsed + delta
                val newValue = "$currentEpochHour:$newUsed"

                val updatedCount =
                    sysConfigService.updateConfigByIdWithOptimisticCheck(
                        SysConfigIds.LLM_USED,
                        oldValue,
                        newValue,
                    )
                if (updatedCount > 0) {
                    return
                }
            }
            throw BusinessException("error.llm.token.usage.update.failed")
        }
    }

    private fun parseHourlyTokenUsage(rawValue: String?): HourlyTokenUsage {
        val currentEpochHour = System.currentTimeMillis() / MILLIS_PER_HOUR
        val value = rawValue?.trim().orEmpty()
        if (value.isBlank()) {
            return HourlyTokenUsage(epochHour = currentEpochHour, used = 0)
        }

        val delimiterIndex = value.indexOf(':')
        if (delimiterIndex <= 0 || delimiterIndex == value.length - 1) {
            return HourlyTokenUsage(epochHour = currentEpochHour, used = 0)
        }

        val hour = value.substring(0, delimiterIndex).toLongOrNull()
        val used = value.substring(delimiterIndex + 1).toLongOrNull()
        if (hour == null || used == null || used < 0) {
            return HourlyTokenUsage(epochHour = currentEpochHour, used = 0)
        }

        return HourlyTokenUsage(epochHour = hour, used = used)
    }

    override fun chat(
        conversationId: String,
        channelId: String,
        message: String,
        publisher: AgentEventPublisher,
        selectedSkillId: String?,
    ) {
        val llmConfig = getCurrentLLMConfigurationDTO() ?: throw BusinessException("error.llm.not.enabled")
        val securityContext = SecurityContextHolder.getContext()

        val locale = LocaleContextHolder.getLocale()
        executor.execute {
            SecurityContextHolder.setContext(securityContext)
            val queryContext =
                AiQueryContext(
                    conversationId = conversationId,
                    channelId = channelId,
                    publisher = publisher,
                    llmConfig = llmConfig,
                )
            try {
                val tool = chatMemory.currentNotRespondedTool(conversationId)
                if (tool != null) {
                    recoverPendingState(tool, queryContext, message, conversationId)
                    return@execute
                }
                if (chatMemory.get(conversationId).isEmpty()) {
                    chatMemory.add(
                        conversationId,
                        SystemMessage(
                            if (selectedSkillId != null) {
                                buildSystemMessageWithSkill(
                                    context = queryContext,
                                    questionForSkillSelection = message,
                                    selectedSkillId = selectedSkillId,
                                )
                            } else {
                                buildSystemMessageWithoutSkill()
                            },
                        ),
                    )
                }
                processConversationLoop(
                    context = queryContext,
                    initialInputMessage = UserMessage(message),
                )
            } catch (e: Exception) {
                runCatching {
//                    if (e is WebClientResponseException) {
                    logger.error("AI query failed", e)
                    val msg: String =
                        if (e is BusinessException) {
                            e.toI18nMessage(locale)
                        } else {
                            e.message ?: "AI query failed(Internal Error)"
                        }
                    publisher.onError(e, msg)
                }
            } finally {
                SecurityContextHolder.clearContext()
                publisher.done()
            }
        }
    }

    private fun recoverPendingState(
        tool: AssistantMessage.ToolCall,
        queryContext: AiQueryContext,
        message: String,
        conversationId: String,
    ) {
        if (tool.name == AskHumanTool.NAME) {
            queryContext.publisher.onToolCallEnd(tool.name, message)
            // TODO: 支持多工具调用?
            processConversationLoop(
                context = queryContext,
                initialInputMessage =
                    ToolResponseMessage
                        .builder()
                        .responses(listOf(ToolResponseMessage.ToolResponse(tool.id, tool.name, message)))
                        .build(),
            )
            return
        } else if (!agentToolsManager.isRequireConfirm(tool.name)) {
            // unreachable.
            logger.warn("Unreachable code, messages: {}, tool name: {}", chatMemory.get(conversationId), tool.name)
            throw IllegalStateException("Unreachable code!")
        }
        processConversationLoop(
            context = queryContext,
            initialInputMessage = recoverPendingConfirm(queryContext, message, tool),
        )
        return
    }

    override fun getCurrentLLMConfiguration(): LLMConfigurationVO {
        val llmConfig = getCurrentLLMConfigurationDTO() ?: return LLMConfigurationVO("", "", 0, false, 0, Instant.now())
        val hourlyUsage = parseHourlyTokenUsage(sysConfigService.findConfigValue(SysConfigIds.LLM_USED))
        val currentUsed = hourlyUsage.used
        val nextRefresh = Instant.ofEpochMilli((hourlyUsage.epochHour + 1) * MILLIS_PER_HOUR)

        return LLMConfigurationVO(
            baseUrl = llmConfig.baseUrl,
            model = llmConfig.model,
            maxTokenPerHour = llmConfig.maxTokenPerHour,
            enabled = llmConfig.enabled,
            currentUsed = currentUsed,
            nextRefresh = nextRefresh,
        )
    }

    private fun getCurrentLLMConfigurationDTO(): LLMConfigurationDTO? {
        val enabled = findConfigValue(SysConfigIds.LLM_ENABLED).toBoolean()
        if (!enabled) {
            return null
        }

        return LLMConfigurationDTO(
            provider = findConfigValue(SysConfigIds.LLM_PROVIDER).ifBlank { "OPENAI" },
            model = findConfigValue(SysConfigIds.LLM_MODEL),
            baseUrl = findConfigValue(SysConfigIds.LLM_BASE_URL),
            apiKey = findConfigValue(SysConfigIds.LLM_API_KEY),
            maxTokenPerHour = findConfigValue(SysConfigIds.LLM_MAX_TOKEN_PER_HOUR).toLong(),
            enabled = true,
        )
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun updateLLMConfiguration(configuration: UpdateLLMConfigurationDTO) {
        configuration.baseUrl?.let {
            sysConfigService.updateConfig(SysConfigIds.LLM_BASE_URL, it)
        }
        configuration.apiKey?.let {
            sysConfigService.updateConfig(SysConfigIds.LLM_API_KEY, it)
        }
        configuration.enabled?.let {
            sysConfigService.updateConfig(SysConfigIds.LLM_ENABLED, it.toString())
        }
        configuration.model?.let {
            sysConfigService.updateConfig(SysConfigIds.LLM_MODEL, it)
        }
        configuration.maxTokenPerHour?.let {
            sysConfigService.updateConfig(SysConfigIds.LLM_MAX_TOKEN_PER_HOUR, it.toString())
        }
    }

    override fun listSkills(): List<SkillDTO> {
        return AiSkillsLoader.loadAllSkills().map { skill ->
            val nameI18nKey = skill.nameI18nKey
            val descriptionI18nKey = skill.descriptionI18nKey
            return@map SkillDTO(
                skill.name,
                if (nameI18nKey == null) {
                    skill.name
                } else {
                    messageSource.getMessage(nameI18nKey, arrayOf(), null)
                },
                if (descriptionI18nKey == null) {
                    skill.description
                } else {
                    messageSource.getMessage(descriptionI18nKey, arrayOf(), null)
                },
                "System",
            )
        }
    }

    private fun buildChatModel(llmConfig: LLMConfigurationDTO): OpenAiChatModel {
        if (!llmConfig.provider.equals("OPENAI", ignoreCase = true)) {
            throw IllegalStateException("Only OPENAI provider is supported")
        }

        val apiKey = llmConfig.apiKey
        if (apiKey.isBlank()) {
            throw IllegalStateException("LLM apiKey is required")
        }

        if (llmConfig.model.isBlank()) {
            throw IllegalStateException("LLM model is required")
        }

        val optionsBuilder = OpenAiChatOptions.builder().apiKey(apiKey)
        if (llmConfig.baseUrl.isNotBlank()) {
            optionsBuilder.baseUrl(llmConfig.baseUrl)
        }
        return OpenAiChatModel.builder().options(optionsBuilder.build()).build()
    }

    private fun getOrCreateChatClient(llmConfig: LLMConfigurationDTO): ChatClient {
        val currentHash = llmConfig.hashCode()
        val cached = cachedChatClient
        if (cached != null && cachedLlmConfigHash == currentHash) {
            return cached
        }
        val secondCheck = cachedChatClient
        if (secondCheck != null && cachedLlmConfigHash == currentHash) {
            return secondCheck
        }
        val rebuilt =
            ChatClient
                .builder(buildChatModel(llmConfig))
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build()
        cachedChatClient = rebuilt
        cachedLlmConfigHash = currentHash
        return rebuilt
    }

    private fun findConfigValue(id: Long): String = sysConfigService.findConfigValue(id) ?: ""
}
