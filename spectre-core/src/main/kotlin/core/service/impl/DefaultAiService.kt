package io.github.vudsen.spectre.core.service.impl

import com.openai.client.OpenAIClient
import com.openai.client.okhttp.OpenAIOkHttpClient
import com.openai.helpers.ChatCompletionAccumulator
import com.openai.models.chat.completions.ChatCompletionCreateParams
import com.openai.models.chat.completions.ChatCompletionMessage
import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import io.github.vudsen.spectre.api.dto.SkillDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.entity.SysConfigIds
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.core.service.ai.AiConversationStateStore
import io.github.vudsen.spectre.core.service.ai.AiQueryContext
import io.github.vudsen.spectre.core.service.ai.AiSkillsLoader
import io.github.vudsen.spectre.core.service.ai.AiToolExecutionContext
import io.github.vudsen.spectre.core.service.ai.AiToolExecutionResult
import io.github.vudsen.spectre.core.service.ai.OpenAiToolRegistry
import io.github.vudsen.spectre.repo.SysConfigRepository
import org.slf4j.LoggerFactory
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
    private val openAiToolRegistry: OpenAiToolRegistry,
) : AiService {

    data class FunctionToolCall(
        val id: String,
        val name: String,
        val arguments: String,
    )

    private data class AssistantTurn(
        val text: String,
        val toolCalls: List<FunctionToolCall>,
    )

    private data class RecoverResult(
        val appendUserMessage: Boolean,
    )

    companion object {
        private val logger = LoggerFactory.getLogger(DefaultAiService::class.java)
        private const val TOKEN_REFRESH_INTERVAL = 1000 * 60 * 60L
    }



    /**
     * 我现在需要你完全重写 io.github.vudsen.spectre.core.service.impl.DefaultAiService#query 方法。不要再使用 spring-ai 了，我需要你使用 com.openai:openai-java 中的 api。
     *
     * 在修改时，忽略已有的代码逻辑，严格按照我这里写的需求来。
     *
     * ## 目标概览
     *
     * 你需要实现一个基于 ReAct 模型的对话接口，这个模型用于帮助用户使用 arthas 解决问题。因为是偏流程性的过程，所以你需要使用 Skills 机制，
     * 可以直接服用 io.github.vudsen.spectre.core.service.ai.AiSkillsLoader 类，在读取到 Skill 后，将其设置到系统提示词中。
     *
     * 和普通的对话模型不同，这里有两个特殊需求：
     *
     * - 系统有一个 askHuman 工具，当调用这个工具时，需要将用户下一个 question 当做工具的回答
     * - 部分命令强制需要用户确认，当 LLM 调用这个工具前，你需要给前端返回 PENDING_CONFIRM状态，然后前端下次的 question 只会是 YES / NO，如果是 YES，则正常执行工具，如果是 NO，将 用户拒绝执行该命令 当做工具返回。
     *
     * 注意，你在调用 LLM 对话时，需要使用它的流式接口。
     *
     * 这次修改只修改后端，不用改前端。
     *
     * ### 消息类型与存储
     *
     * 对于前端来说，它们只会收到 io.github.vudsen.spectre.api.dto.AiMessageDTO.MessageType 中的 5 种类型。
     *
     * PENDING_CONFIRM 和 ASK_HUMAN 的前一条消息一定是 TOOL_CALL_START。
     *
     * 对于后端服务，你不需要存储这五种类型的消息，你只用发出去就不用管了。而在后端，你真正需要存储的是和AI对话的消息：
     *
     * - SysMessage：系统消息
     * - UserMessage: 用户信息
     * - ToolResponseMessage: 工具调用响应
     * - AssistantMessage: LLM 返回的消息
     *
     * 它们实际都只需要保存为字符串就行了，但是部分可能需要保存额外信息。例如 AssistantMessage 你可能需要保存它调用了哪些工具，以便后续 PENDING_CONFIRM 和 ASK_HUMAN 状态的恢复。
     *
     * 需要注意的是，一次 AssistantMessage 中可能会有多个工具调用，你只能串行调用，并且还需要处理 PENDING_CONFIRM 和 ASK_HUMAN 状态。
     *
     * ### 工具修改
     *
     * 由于不再使用 spring-ai，你需要将 io.github.vudsen.spectre.core.configuration.AiToolsConfiguration 中的所有工具重构为 open-ai 适配的类型。
     *
     * ### 关于消息存储
     *
     * 消息存储直接使用 org.springframework.cache.CacheManager 存储，key 使用 io.github.vudsen.spectre.core.configuration.constant.CacheConstant#DEFAULT_CACHE_KEY
     *
     * ## 对话流程
     *
     * 1. 当用户第一次对话，即当前状态下没有选中的 Skill，你需要先让 LLM 根据用户问题选择合适的 skill (把所有skill名称和描述加载到提示词中)，然后在对话状态中记录这个skill
     * 2. 之后就一直使用这个 skill，直到当前对话结束(最后一条消息没有任何工具调用)
     *
     * ## 其它注意事项
     *
     * 1. 你需要告诉我如果将某个工具标记为需要确认
     * 2. 不要每次用户查询都更新系统提示词，仅在第一次对话或者最终会话清空时才插入系统提示词
     * 3. 如果你有任何不清楚的问题或者边界条件，请及时询问我
     */
    override fun query(
        conversationId: String,
        channelId: String,
        question: String,
    ): Flux<AiMessageDTO> {
        val llmConfig = getCurrentLLMConfiguration() ?: throw BusinessException("LLM 未开启")
        val securityContext = SecurityContextHolder.getContext()

        return Flux.create { sink ->
            val client = buildOpenAiClient(llmConfig)
            val queryContext = AiQueryContext(
                conversationId = conversationId,
                channelId = channelId,
                sink = sink,
                client = client,
                securityContext = securityContext,
                llmConfig = llmConfig,
            )
            try {
                val recoverResult = recoverPendingState(
                    context = queryContext,
                    question = question,
                )

                ensureSystemMessageIfNeeded(
                    context = queryContext,
                    questionForSkillSelection = if (recoverResult.appendUserMessage) question else null,
                )

                if (recoverResult.appendUserMessage) {
                    aiConversationStateStore.appendUserMessage(conversationId, question)
                }

                processConversationLoop(queryContext)
            } catch (e: Exception) {
                logger.error("AI query failed", e)
                sink.next(AiMessageDTO(AiMessageDTO.MessageType.ERROR, e.message ?: "AI query failed"))
            } finally {
                client.close()
                sink.complete()
            }
        }
    }

    private fun processConversationLoop(context: AiQueryContext) {
        val maxIteration = 10
        var currentIteration = 0
        while (currentIteration < maxIteration) {
            currentIteration++
            val assistantTurn = requestAssistantTurn(context)

            if (assistantTurn.toolCalls.isEmpty()) {
                aiConversationStateStore.clearSelectedSkill(context.conversationId)
                return
            }

            for (toolCall in assistantTurn.toolCalls) {
                val parameter = openAiToolRegistry.resolveParameter(toolCall.name, toolCall.arguments)
                context.sink.next(
                    AiMessageDTO(
                        type = AiMessageDTO.MessageType.TOOL_CALL_START,
                        data = toolCall.name,
                        parameter = parameter,
                    )
                )

                if (openAiToolRegistry.requiresConfirm(toolCall.name)) {
                    aiConversationStateStore.savePendingToolConfirm(
                        conversationId = context.conversationId,
                        toolCallId = toolCall.id,
                        toolName = toolCall.name,
                        toolArguments = toolCall.arguments,
                        parameter = parameter,
                        channelId = context.channelId,
                    )
                    context.sink.next(
                        AiMessageDTO(
                            type = AiMessageDTO.MessageType.PENDING_CONFIRM,
                            data = toolCall.name,
                            parameter = parameter,
                        )
                    )
                    return
                }

                val executionResult = openAiToolRegistry.execute(
                    toolName = toolCall.name,
                    context = AiToolExecutionContext(
                        conversationId = context.conversationId,
                        channelId = context.channelId,
                        securityContext = context.securityContext,
                    ),
                    argumentsJson = toolCall.arguments,
                )

                when (executionResult) {
                    is AiToolExecutionResult.Success -> {
                        aiConversationStateStore.appendToolResponseMessage(
                            conversationId = context.conversationId,
                            toolCallId = toolCall.id,
                            toolName = toolCall.name,
                            responseData = executionResult.output,
                        )
                        context.sink.next(
                            AiMessageDTO(
                                type = AiMessageDTO.MessageType.TOOL_CALL_END,
                                data = toolCall.name,
                                parameter = executionResult.parameter ?: parameter,
                            )
                        )
                    }

                    is AiToolExecutionResult.AskHuman -> {
                        aiConversationStateStore.savePendingAskHuman(
                            conversationId = context.conversationId,
                            toolCallId = toolCall.id,
                            toolName = toolCall.name,
                            requestJson = executionResult.requestJson,
                            parameter = executionResult.requestJson,
                        )
                        context.sink.next(
                            AiMessageDTO(
                                type = AiMessageDTO.MessageType.ASK_HUMAN,
                                data = toolCall.name,
                                parameter = executionResult.requestJson,
                            )
                        )
                        return
                    }
                }
            }
        }
        if (currentIteration == maxIteration) {
            context.sink.next(
                AiMessageDTO(
                    type = AiMessageDTO.MessageType.ERROR,
                    data = "达到迭代次数"
                )
            )
        }
    }

    private fun requestAssistantTurn(context: AiQueryContext): AssistantTurn {
        val requestBuilder = ChatCompletionCreateParams.builder()
            .model(context.llmConfig.model)
            .parallelToolCalls(false)

        if (context.llmConfig.maxTokenPerHour > 0) {
            requestBuilder.maxCompletionTokens(context.llmConfig.maxTokenPerHour)
        }

        aiConversationStateStore.buildChatCompletionMessages(context.conversationId).forEach { message ->
            requestBuilder.addMessage(message)
        }

        openAiToolRegistry.openAiTools().forEach { tool ->
            requestBuilder.addTool(tool)
        }

        val accumulator = ChatCompletionAccumulator.create()
        val streamedText = StringBuilder()

        context.client.chat().completions().createStreaming(requestBuilder.build()).use { stream ->
            stream.stream().forEach { chunk ->
                accumulator.accumulate(chunk)
                val choice = chunk.choices()[0]
                choice.delta().content().ifPresent { delta ->
                    if (delta.isNotEmpty()) {
                        streamedText.append(delta)
                        context.sink.next(AiMessageDTO(AiMessageDTO.MessageType.TOKEN, delta))
                    }
                }
            }
        }

        val completion = accumulator.chatCompletion()
        val totalTokens = completion.usage().get().totalTokens()

        val message = completion.choices().firstOrNull()?.message()
            ?: throw AppException("Empty completion from model")

        val text = message.content().orElse("").ifBlank { streamedText.toString() }
        if (streamedText.isEmpty() && text.isNotBlank()) {
            context.sink.next(AiMessageDTO(AiMessageDTO.MessageType.TOKEN, text))
        }

        val toolCalls = extractFunctionToolCalls(message)

        aiConversationStateStore.appendAssistantMessage(
            conversationId = context.conversationId,
            content = text,
            toolCalls = toolCalls.map {
                AiConversationStateStore.AssistantToolCall(
                    id = it.id,
                    name = it.name,
                    arguments = it.arguments,
                    type = "function",
                )
            },
        )

        return AssistantTurn(
            text = text,
            toolCalls = toolCalls,
        )
    }

    private fun extractFunctionToolCalls(message: ChatCompletionMessage): List<FunctionToolCall> {
        val toolCalls = message.toolCalls().getOrNull() ?: return emptyList()
        return buildList {
            for (toolCall in toolCalls) {
                if (!toolCall.isFunction()) {
                    continue
                }
                val functionToolCall = toolCall.asFunction()
                val callId = functionToolCall.id()
                val function = functionToolCall.function()
                add(
                    FunctionToolCall(
                        id = callId,
                        name = function.name(),
                        arguments = function.arguments(),
                    )
                )
            }
        }
    }

    private fun recoverPendingState(
        context: AiQueryContext,
        question: String,
    ): RecoverResult {
        val pendingToolConfirm = aiConversationStateStore.getPendingToolConfirm(context.conversationId)
        if (pendingToolConfirm != null) {
            return recoverPendingConfirm(
                context = context,
                question = question,
                pending = pendingToolConfirm,
            )
        }

        val pendingAskHuman = aiConversationStateStore.takePendingAskHuman(context.conversationId)
        if (pendingAskHuman != null) {
            aiConversationStateStore.appendToolResponseMessage(
                conversationId = context.conversationId,
                toolCallId = pendingAskHuman.toolCallId,
                toolName = pendingAskHuman.toolName,
                responseData = question,
            )
            context.sink.next(
                AiMessageDTO(
                    type = AiMessageDTO.MessageType.TOOL_CALL_END,
                    data = pendingAskHuman.toolName,
                    parameter = pendingAskHuman.parameter,
                )
            )
            return RecoverResult(appendUserMessage = false)
        }

        return RecoverResult(appendUserMessage = true)
    }

    private fun recoverPendingConfirm(
        context: AiQueryContext,
        question: String,
        pending: AiConversationStateStore.PendingToolConfirmState,
    ): RecoverResult {
        val response = when (question) {
            "YES" -> {
                aiConversationStateStore.takePendingToolConfirm(context.conversationId)
                val executionResult = openAiToolRegistry.execute(
                    toolName = pending.toolName,
                    context = AiToolExecutionContext(
                        conversationId = context.conversationId,
                        channelId = context.channelId,
                        securityContext = context.securityContext,
                    ),
                    argumentsJson = pending.toolArguments,
                )

                when (executionResult) {
                    is AiToolExecutionResult.Success -> executionResult.output
                    is AiToolExecutionResult.AskHuman -> {
                        throw AppException("Confirm-required tool cannot return askHuman state")
                    }
                }
            }

            "NO" -> {
                aiConversationStateStore.takePendingToolConfirm(context.conversationId)
                "用户拒绝执行该命令"
            }

            else -> {
                throw IllegalArgumentException("Pending confirmation only accepts YES or NO")
            }
        }

        aiConversationStateStore.appendToolResponseMessage(
            conversationId = context.conversationId,
            toolCallId = pending.toolCallId,
            toolName = pending.toolName,
            responseData = response,
        )

        context.sink.next(
            AiMessageDTO(
                type = AiMessageDTO.MessageType.TOOL_CALL_END,
                data = pending.toolName,
                parameter = pending.parameter,
            )
        )

        return RecoverResult(appendUserMessage = false)
    }

    private fun ensureSystemMessageIfNeeded(
        context: AiQueryContext,
        questionForSkillSelection: String?,
    ) {
        val alreadySelected = aiConversationStateStore.getSelectedSkill(context.conversationId)
        if (!alreadySelected.isNullOrBlank()) {
            return
        }

        val selectedSkillName = resolveSelectedSkill(
            context = context,
            questionForSkillSelection = questionForSkillSelection,
        ) ?: return

        val selectedSkillContent = aiSkillsLoader.loadSkill(selectedSkillName)
        aiConversationStateStore.upsertSystemMessage(context.conversationId, """You are an Java troubleshooting assistant.
            You are allowed to run arthas command to help user solve problems. Follow the next instructions to help user:
            
            $selectedSkillContent
        """.trimIndent())
    }

    private fun resolveSelectedSkill(
        context: AiQueryContext,
        questionForSkillSelection: String?,
    ): String? {
        val selected = aiConversationStateStore.getSelectedSkill(context.conversationId)
        if (!selected.isNullOrBlank()) {
            return selected
        }

        val question = questionForSkillSelection?.trim().orEmpty()
        if (question.isBlank()) {
            return null
        }

        val skills = aiSkillsLoader.loadAllSkills()
        if (skills.isEmpty()) {
            return null
        }

        val chosen = selectSkillWithLlm(
            context = context,
            question = question,
            skills = skills,
        )

        if (chosen != null) {
            aiConversationStateStore.saveSelectedSkill(context.conversationId, chosen)
        }
        return chosen
    }

    private fun selectSkillWithLlm(
        context: AiQueryContext,
        question: String,
        skills: List<SkillDTO>,
    ): String? {
        val skillList = skills.joinToString("\n") { "- ${it.name}: ${it.description}" }

        val selectionPrompt = """
            You are selecting one troubleshooting skill for an Arthas assistant.
            Choose exactly one skill name from the list below.
            Return ONLY the skill name. If no skill is suitable, return none.
            
            Skill list:
            $skillList
        """.trimIndent()

        val requestBuilder = ChatCompletionCreateParams.builder()
            .model(context.llmConfig.model)
            .addSystemMessage(selectionPrompt)
            .addUserMessage(question)

        val response = context.client.chat().completions().create(requestBuilder.build())
        val totalTokens = response.usage().get().totalTokens()

        val content = response.choices().firstOrNull()?.message()?.content()?.orElse("").orEmpty().trim()
        val normalized = normalizeSkillSelection(content)
        if (normalized.isBlank() || normalized.equals("none", ignoreCase = true)) {
            return null
        }

        return skills.firstOrNull { it.name.equals(normalized, ignoreCase = true) }?.name
    }

    private fun normalizeSkillSelection(raw: String): String {
        val firstLine = raw.lineSequence()
            .map { it.trim() }
            .firstOrNull { it.isNotBlank() && !it.startsWith("```") }
            .orEmpty()

        val candidate = if (firstLine.startsWith("name:", ignoreCase = true)) {
            firstLine.substringAfter(':').trim()
        } else {
            firstLine
        }

        return candidate.trim('"', '\'', '`')
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
            maxTokenPerHour = findConfigValue(SysConfigIds.LLM_MAX_TOKEN_PER_HOUR).toLong(),
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

    private fun buildOpenAiClient(llmConfig: LLMConfigurationDTO): OpenAIClient {
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

        val builder = OpenAIOkHttpClient.builder()
            .apiKey(apiKey)
        if (llmConfig.baseUrl.isNotBlank()) {
            builder.baseUrl(llmConfig.baseUrl)
        }
        return builder.build()
    }

    private fun findConfigValue(id: Long): String {
        return sysConfigRepository.findById(id).getOrNull()?.value.orEmpty()
    }
}
