package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import io.github.vudsen.spectre.api.dto.SkillDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.AiTools
import io.github.vudsen.spectre.api.entity.Skill
import io.github.vudsen.spectre.api.entity.SysConfigIds
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.api.service.SysConfigService
import io.github.vudsen.spectre.api.vo.LLMConfigurationVO
import io.github.vudsen.spectre.core.service.ai.AiQueryContext
import io.github.vudsen.spectre.core.service.ai.AiSkillsLoader
import io.github.vudsen.spectre.core.service.ai.AiToolCall
import io.github.vudsen.spectre.core.service.ai.AiToolExecutionContext
import io.github.vudsen.spectre.core.service.ai.AiToolRegistry
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.memory.ChatMemory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.messages.Message
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.ToolResponseMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.chat.model.ChatResponse
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.ai.openai.OpenAiChatModel
import org.springframework.ai.openai.OpenAiChatOptions
import org.springframework.ai.openai.api.OpenAiApi
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.reactive.function.client.WebClientResponseException
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
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
    private val aiToolRegistry: AiToolRegistry,
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

    private data class AssistantTurn(
        val text: String,
        val toolCalls: List<AiToolCall>,
        val usageTokens: Long,
    )

    private data class RecoverResult(
        val nextMessage: Message,
    )

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

    override fun query(
        conversationId: String,
        channelId: String,
        question: String,
        emitter: SseEmitter,
    ) {
        queryInternal(
            conversationId = conversationId,
            channelId = channelId,
            question = question,
            emitter = emitter,
            enableSkill = false,
            null,
        )
    }

    override fun queryWithSkill(
        conversationId: String,
        channelId: String,
        question: String,
        emitter: SseEmitter,
        selectedSkillId: String?,
    ) {
        queryInternal(
            conversationId = conversationId,
            channelId = channelId,
            question = question,
            emitter = emitter,
            enableSkill = true,
            selectedSkillId,
        )
    }

    private fun queryInternal(
        conversationId: String,
        channelId: String,
        question: String,
        emitter: SseEmitter,
        enableSkill: Boolean,
        selectedSkillId: String?,
    ) {
        val llmConfig = getCurrentLLMConfigurationDTO() ?: throw BusinessException("error.llm.not.enabled")
        val securityContext = SecurityContextHolder.getContext()

        val locale = LocaleContextHolder.getLocale()
        executor.execute {
            val queryContext =
                AiQueryContext(
                    conversationId = conversationId,
                    channelId = channelId,
                    emitter = emitter,
                    securityContext = securityContext,
                    llmConfig = llmConfig,
                )
            try {
                val recoverResult =
                    recoverPendingState(
                        context = queryContext,
                        question = question,
                    )

                val shouldInitializeSystemMessage = chatMemory.get(conversationId).isEmpty()
                val systemMessage =
                    if (shouldInitializeSystemMessage) {
                        if (enableSkill) {
                            val systemMessageWithSkill = buildSystemMessageWithSkill(
                                context = queryContext,
                                questionForSkillSelection = question,
                                selectedSkillId = selectedSkillId,
                            )
                            systemMessageWithSkill
                        } else {
                            buildSystemMessageWithoutSkill()
                        }
                    } else {
                        null
                    }
                if (shouldInitializeSystemMessage) {
                    if (systemMessage == null) {
                        emitter.send(
                            AiMessageDTO(AiMessageDTO.MessageType.TOKEN, "未能理解您的问题，请提供更多上下文后重试"),
                        )
                        return@execute
                    }
                    chatMemory.add(conversationId, SystemMessage(systemMessage))
                }

                processConversationLoop(
                    context = queryContext,
                    initialInputMessage = recoverResult.nextMessage,
                )
            } catch (e: Exception) {
                runCatching {
                    if (e is WebClientResponseException) {
                        logger.error("AI query failed, response body = '{}', statusCode = {}", e.responseBodyAsString, e.statusCode)
                    } else {
                        logger.error("AI query failed", e)
                    }
                    val msg: String =
                        if (e is BusinessException) {
                            e.toI18nMessage(locale)
                        } else {
                            e.message ?: "AI query failed(Internal Error)"
                        }
                    sendMessage(
                        queryContext,
                        AiMessageDTO(AiMessageDTO.MessageType.ERROR, msg),
                    )
                }
            } finally {
                emitter.complete()
            }
        }
    }

    private fun processConversationLoop(
        context: AiQueryContext,
        initialInputMessage: Message,
    ) {
        val maxIteration = 10
        var currentIteration = 0
        var nextInputMessage: Message? = initialInputMessage
        while (currentIteration < maxIteration) {
            currentIteration++
            val assistantTurn =
                requestAssistantTurn(
                    context = context,
                    inputMessage = nextInputMessage ?: break,
                )
            nextInputMessage = null

            if (assistantTurn.toolCalls.isEmpty()) {
                return
            }

            for (toolCall in assistantTurn.toolCalls) {
                val parameter = aiToolRegistry.resolveParameter(toolCall.name, toolCall.arguments)
                sendMessage(
                    context,
                    AiMessageDTO(
                        type = AiMessageDTO.MessageType.TOOL_CALL_START,
                        data = toolCall.name,
                        parameter = parameter,
                    ),
                )

                if (aiToolRegistry.requiresConfirm(toolCall.name)) {
                    sendMessage(
                        context,
                        AiMessageDTO(
                            type = AiMessageDTO.MessageType.PENDING_CONFIRM,
                            data = toolCall.name,
                            parameter = parameter,
                        ),
                    )
                    return
                }

                if (toolCall.name == AiTools.ASK_HUMAN) {
                    sendMessage(
                        context,
                        AiMessageDTO(
                            type = AiMessageDTO.MessageType.ASK_HUMAN,
                            data = toolCall.name,
                            parameter = toolCall.arguments,
                        ),
                    )
                    return
                }

                val executionResult =
                    aiToolRegistry.execute(
                        toolName = toolCall.name,
                        context =
                            AiToolExecutionContext(
                                conversationId = context.conversationId,
                                channelId = context.channelId,
                                securityContext = context.securityContext,
                            ),
                        argumentsJson = toolCall.arguments,
                    )

                nextInputMessage = buildToolResponseMessage(toolCall.id, toolCall.name, executionResult.output)
                sendMessage(
                    context,
                    AiMessageDTO(
                        type = AiMessageDTO.MessageType.TOOL_CALL_END,
                        data = toolCall.name,
                        parameter = executionResult.output,
                    ),
                )
                break
            }
        }
        if (currentIteration == maxIteration) {
            sendMessage(
                context,
                AiMessageDTO(
                    type = AiMessageDTO.MessageType.ERROR,
                    data = "达到迭代次数",
                ),
            )
        }
    }

    private fun requestAssistantTurn(
        context: AiQueryContext,
        inputMessage: Message,
    ): AssistantTurn {
        ensureNotExceededTokenLimit(context.llmConfig.maxTokenPerHour)

        val chatClient = getOrCreateChatClient(context.llmConfig)
        val options = buildLlmOptions(context) {
            internalToolExecutionEnabled(false)
            toolCallbacks(*aiToolRegistry.toolCallbacks())
        }

        var latest: ChatResponse? = null
        val assistantMessageBuilder = StringBuilder()
        chatClient.prompt()
            .options(options)
            .messages(inputMessage)
            .advisors { spec ->
                spec.param(ChatMemory.CONVERSATION_ID, context.conversationId)
            }.stream()
            .chatResponse()
            .doOnNext { response ->
                latest = response
                val delta = response.result?.output?.text.orEmpty()
                if (delta.isNotEmpty()) {
                    assistantMessageBuilder.append(delta)
                    sendMessage(context, AiMessageDTO(AiMessageDTO.MessageType.TOKEN, delta))
                }
            }.blockLast()

        val finalResponse = latest ?: throw AppException("Empty completion from model")
        val assistantMessage = finalResponse.result!!.output

        val toolCalls =
            assistantMessage.toolCalls.map { toolCall ->
                AiToolCall(
                    id = toolCall.id(),
                    name = toolCall.name(),
                    arguments = toolCall.arguments(),
                )
            }

        val usedTokens = finalResponse.metadata.usage.totalTokens.toLong()
        recordTokenUsage(usedTokens)

        return AssistantTurn(assistantMessageBuilder.toString(), toolCalls, usedTokens)
    }

    private fun recoverPendingState(
        context: AiQueryContext,
        question: String,
    ): RecoverResult {
        val pendingToolConfirm = getPendingToolConfirmFromMemory(context.conversationId)
        if (pendingToolConfirm != null) {
            return recoverPendingConfirm(
                context = context,
                question = question,
                pending = pendingToolConfirm,
            )
        }

        val pendingAskHuman = getPendingAskHumanFromMemory(context.conversationId)
        if (pendingAskHuman != null) {
            sendMessage(
                context,
                AiMessageDTO(
                    type = AiMessageDTO.MessageType.TOOL_CALL_END,
                    data = pendingAskHuman.toolName,
                    parameter = pendingAskHuman.parameter,
                ),
            )
            return RecoverResult(nextMessage = buildToolResponseMessage(pendingAskHuman.toolCallId, pendingAskHuman.toolName, question))
        }

        return RecoverResult(nextMessage = UserMessage(question))
    }

    private fun recoverPendingConfirm(
        context: AiQueryContext,
        question: String,
        pending: PendingToolConfirmState,
    ): RecoverResult {
        val response =
            when (question) {
                "YES" -> {
                    val executionResult =
                        aiToolRegistry.execute(
                            toolName = pending.toolName,
                            context =
                                AiToolExecutionContext(
                                    conversationId = context.conversationId,
                                    channelId = context.channelId,
                                    securityContext = context.securityContext,
                                ),
                            argumentsJson = pending.toolArguments,
                        )

                    executionResult.output
                }

                "NO" -> {
                    "User refuse to execute this command, please try another command or exit the process."
                }

                else -> {
                    throw IllegalArgumentException("Pending confirmation only accepts YES or NO")
                }
            }

        sendMessage(
            context,
            AiMessageDTO(
                type = AiMessageDTO.MessageType.TOOL_CALL_END,
                data = pending.toolName,
                parameter = response,
            ),
        )

        return RecoverResult(nextMessage = buildToolResponseMessage(pending.toolCallId, pending.toolName, response))
    }

    private data class PendingToolConfirmState(
        val toolCallId: String,
        val toolName: String,
        val toolArguments: String,
        val parameter: String?,
    )

    private data class PendingAskHumanState(
        val toolCallId: String,
        val toolName: String,
        val requestJson: String,
        val parameter: String?,
    )

    private fun getPendingToolConfirmFromMemory(conversationId: String): PendingToolConfirmState? {
        val toolCall = readLastAssistantToolCall(conversationId) ?: return null
        if (!aiToolRegistry.requiresConfirm(toolCall.name())) {
            return null
        }
        return PendingToolConfirmState(
            toolCallId = toolCall.id(),
            toolName = toolCall.name(),
            toolArguments = toolCall.arguments(),
            parameter = aiToolRegistry.resolveParameter(toolCall.name(), toolCall.arguments()),
        )
    }

    private fun getPendingAskHumanFromMemory(conversationId: String): PendingAskHumanState? {
        val toolCall = readLastAssistantToolCall(conversationId) ?: return null
        if (toolCall.name() != AiTools.ASK_HUMAN) {
            return null
        }
        return PendingAskHumanState(
            toolCallId = toolCall.id(),
            toolName = toolCall.name(),
            requestJson = toolCall.arguments(),
            parameter = toolCall.arguments(),
        )
    }

    private fun readLastAssistantToolCall(conversationId: String): AssistantMessage.ToolCall? {
        val lastMessage = chatMemory.get(conversationId).lastOrNull() as? AssistantMessage ?: return null
        return lastMessage.toolCalls.firstOrNull()
    }

    private fun buildToolResponseMessage(
        toolCallId: String,
        toolName: String,
        responseData: String,
    ): ToolResponseMessage {
        val toolResponse = ToolResponseMessage.ToolResponse(toolCallId, toolName, responseData)
        return ToolResponseMessage
            .builder()
            .responses(listOf(toolResponse))
            .metadata(mapOf())
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

        val response = buildChatModel(context.llmConfig)
            .call(Prompt(listOf(SystemMessage(selectionPrompt), UserMessage(question)), options))

        val content = response.result?.output?.text.orEmpty().trim()

        val usedTokens =
            response.metadata.usage.totalTokens.toLong()
                ?: estimateTokens(selectionPrompt.length + question.length + content.length)

        recordTokenUsage(usedTokens)
        val normalized = normalizeSkillSelection(content)
        if (normalized.isBlank() || normalized.equals("none", ignoreCase = true)) {
            return null
        }

        return skills.firstOrNull { it.name.equals(normalized, ignoreCase = true) }?.name
    }

    private fun buildLlmOptions(context: AiQueryContext, customise: (OpenAiChatOptions.Builder.() -> Unit)? = null): OpenAiChatOptions {
        // Disable thinking.
        val extraBody: Map<String, Any>? = when (context.llmConfig.model) {
            "deepseek-v4-flash", "deepseek-v4-pro" -> mapOf(
                "thinking" to mapOf(
                    "type" to "disabled"
                )
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
        return optionsBuilder.build()
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

    private fun estimateTokens(charCount: Int): Long {
        if (charCount <= 0) {
            return 0
        }
        return ((charCount + 3) / 4).toLong()
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

    override fun getCurrentLLMConfiguration(): LLMConfigurationVO? {
        val llmConfig = getCurrentLLMConfigurationDTO() ?: return null
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

    private fun sendMessage(
        context: AiQueryContext,
        message: AiMessageDTO,
    ) {
        context.emitter.send(message)
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

        val apiBuilder = OpenAiApi.builder().apiKey(apiKey)
        if (llmConfig.baseUrl.isNotBlank()) {
            apiBuilder.baseUrl(llmConfig.baseUrl)
        }
        return OpenAiChatModel.builder().openAiApi(apiBuilder.build()).build()
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
