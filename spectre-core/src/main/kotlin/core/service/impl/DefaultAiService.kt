package io.github.vudsen.spectre.core.service.impl

import com.openai.client.OpenAIClient
import com.openai.client.okhttp.OpenAIOkHttpClient
import com.openai.helpers.ChatCompletionAccumulator
import com.openai.models.chat.completions.ChatCompletionChunk
import com.openai.models.chat.completions.ChatCompletionCreateParams
import com.openai.models.chat.completions.ChatCompletionMessage
import com.openai.models.completions.CompletionUsage
import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import io.github.vudsen.spectre.api.dto.SkillDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.entity.SysConfigIds
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.api.service.SysConfigService
import io.github.vudsen.spectre.api.vo.LLMConfigurationVO
import io.github.vudsen.spectre.core.service.ai.*
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.time.Instant
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.Executor
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock
import kotlin.jvm.optionals.getOrNull
import kotlin.math.min

@Service
class DefaultAiService(
    private val sysConfigService: SysConfigService,
    private val aiConversationStateStore: AiConversationStateStore,
    private val aiSkillsLoader: AiSkillsLoader,
    private val openAiToolRegistry: OpenAiToolRegistry,
) : AiService {

    private val executor: Executor = ThreadPoolExecutor(
        0,
        4,
        30,
        TimeUnit.MINUTES,
        ArrayBlockingQueue(32)
    ) { _, _ -> throw BusinessException("服务繁忙，请稍后再试") }

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
        private const val TOKEN_USAGE_UPDATE_MAX_RETRIES = 3
        private const val MILLIS_PER_HOUR = 1000L * 60 * 60
        private const val MAX_CONVERSATION_TOKEN = 100000L
    }

    private data class HourlyTokenUsage(
        val epochHour: Long,
        val used: Long,
    )

    private val tokenUsageLock = ReentrantLock()


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
        emitter: SseEmitter,
    ) {
        queryInternal(
            conversationId = conversationId,
            channelId = channelId,
            question = question,
            emitter = emitter,
            enableSkill = false,
        )
    }

    override fun queryWithSkill(
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
            enableSkill = true,
        )
    }

    private fun queryInternal(
        conversationId: String,
        channelId: String,
        question: String,
        emitter: SseEmitter,
        enableSkill: Boolean,
    ) {
        val llmConfig = getCurrentLLMConfigurationDTO() ?: throw BusinessException("LLM 未开启")
        val securityContext = SecurityContextHolder.getContext()

        executor.execute {
            val client = buildOpenAiClient(llmConfig)
            val queryContext = AiQueryContext(
                conversationId = conversationId,
                channelId = channelId,
                emitter = emitter,
                client = client,
                securityContext = securityContext,
                llmConfig = llmConfig,
            )
            try {
                val recoverResult = recoverPendingState(
                    context = queryContext,
                    question = question,
                )

                if (enableSkill) {
                    if (ensureSystemMessageWithSkill(
                            context = queryContext,
                            questionForSkillSelection = if (recoverResult.appendUserMessage) question else null,
                        )
                    ) {
                        emitter.send(
                            AiMessageDTO(AiMessageDTO.MessageType.TOKEN, "未能理解您的问题，请提供更多上下文后重试")
                        )
                        return@execute
                    }
                } else {
                    ensureSystemMessageWithoutSkill(queryContext)
                }

                if (recoverResult.appendUserMessage) {
                    aiConversationStateStore.appendUserMessage(conversationId, question)
                }

                processConversationLoop(queryContext)
            } catch (e: Exception) {
                logger.error("AI query failed", e)
                runCatching {
                    sendMessage(
                        queryContext,
                        AiMessageDTO(AiMessageDTO.MessageType.ERROR, e.message ?: "AI query failed")
                    )
                }
            } finally {
                client.close()
                emitter.complete()
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
                sendMessage(
                    context,
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
                    sendMessage(
                        context,
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
                        sendMessage(
                            context,
                            AiMessageDTO(
                                type = AiMessageDTO.MessageType.TOOL_CALL_END,
                                data = toolCall.name,
                                parameter = executionResult.output,
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
                        sendMessage(
                            context,
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
            sendMessage(
                context,
                AiMessageDTO(
                    type = AiMessageDTO.MessageType.ERROR,
                    data = "达到迭代次数"
                )
            )
        }
    }

    private fun requestAssistantTurn(context: AiQueryContext): AssistantTurn {
        ensureNotExceededTokenLimit(context.llmConfig.maxTokenPerHour)

        val conversationMessages = aiConversationStateStore.buildChatCompletionMessages(context.conversationId)
        val tools = openAiToolRegistry.openAiTools()

        val requestBuilder = ChatCompletionCreateParams.builder()
            .model(context.llmConfig.model)
            .parallelToolCalls(false)

        if (context.llmConfig.maxTokenPerHour > 0) {
            requestBuilder.maxCompletionTokens(min(context.llmConfig.maxTokenPerHour, MAX_CONVERSATION_TOKEN))
        } else {
            requestBuilder.maxCompletionTokens(MAX_CONVERSATION_TOKEN)
        }

        conversationMessages.forEach { message ->
            requestBuilder.addMessage(message)
        }

        tools.forEach { tool ->
            requestBuilder.addTool(tool)
        }

        val accumulator = ChatCompletionAccumulator.create()
        val streamedText = StringBuilder()
        var hasChoiceChunk = false

        var usage: CompletionUsage? = null
        context.client.chat().completions().createStreaming(requestBuilder.build()).use { stream ->
            stream.stream().forEach { chunk ->
                val choice = chunk.choices()[0]
                hasChoiceChunk = true
                if (chunk.usage().isPresent) {
                    usage = chunk.usage().get()
                    // 有 bug，直接传会报错，需要过滤掉 usage 属性
                    accumulator.accumulate(
                        ChatCompletionChunk.builder()
                            .id(chunk.id())
                            .created(chunk.created())
                            .model(chunk.model())
                            .systemFingerprint(chunk.systemFingerprint().get())
                            .addChoice(choice)
                            .build()
                    )
                } else {
                    accumulator.accumulate(chunk)
                }
                choice.delta().content().ifPresent { delta ->
                    if (delta.isNotEmpty()) {
                        streamedText.append(delta)
                        sendMessage(context, AiMessageDTO(AiMessageDTO.MessageType.TOKEN, delta))
                    }
                }
            }
        }

        if (!hasChoiceChunk) {
            throw AppException("No completion choices returned from model stream")
        }

        val completion = accumulator.chatCompletion()

        val message = completion.choices().firstOrNull()?.message()
            ?: throw AppException("Empty completion from model")

        val text = message.content().orElse("").ifBlank { streamedText.toString() }
        if (streamedText.isEmpty() && text.isNotBlank()) {
            sendMessage(context, AiMessageDTO(AiMessageDTO.MessageType.TOKEN, text))
        }

        val toolCalls = extractFunctionToolCalls(message)
        val estimatedCompletionTokens = usage?.totalTokens()
            ?: (estimateTokens(text.length + toolCalls.sumOf { it.name.length + it.arguments.length }) +
                    estimateTokens(conversationMessages.sumOf { it.toString().length } + tools.sumOf { it.toString().length }))

        recordTokenUsage(estimatedCompletionTokens)

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
            sendMessage(
                context,
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

        sendMessage(
            context,
            AiMessageDTO(
                type = AiMessageDTO.MessageType.TOOL_CALL_END,
                data = pending.toolName,
                parameter = response,
            )
        )

        return RecoverResult(appendUserMessage = false)
    }

    /**
     * @return true 表示获取技能失败
     */
    private fun ensureSystemMessageWithSkill(
        context: AiQueryContext,
        questionForSkillSelection: String?,
    ): Boolean {
        val alreadySelected = aiConversationStateStore.getSelectedSkill(context.conversationId)
        if (!alreadySelected.isNullOrBlank()) {
            return false
        }

        val selectedSkillName = resolveSelectedSkill(
            context = context,
            questionForSkillSelection = questionForSkillSelection,
        )
        if (selectedSkillName == null) {
            return true
        }

        val selectedSkillContent = aiSkillsLoader.loadSkill(selectedSkillName)
        aiConversationStateStore.upsertSystemMessage(
            context.conversationId,
            """You are a Java troubleshooting assistant responsible for diagnosing runtime problems in Java applications.

You are allowed to run Arthas commands to collect runtime information and help the user analyze the issue.

Use the following skill instructions:

$selectedSkillContent

## Decision Flow

When handling a user problem:

1. Read the Skill instructions.
2. Identify whether the Skill requires specific parameters.
3. If all required parameters are available:
   - Execute the Arthas command suggested by the Skill.
4. If a required parameter is missing:
   - Ask the user ONLY for that parameter using `askHuman`.
5. If the Skill does not require additional parameters:
   - Do NOT ask the user questions.
   - Continue with diagnostic commands.

## Skill Parameter Policy

You MUST follow these rules:

1. Only ask the user for information if the Skill explicitly requires a parameter that is currently missing.
2. If the Skill does NOT explicitly require the information, DO NOT ask the user.
3. Do NOT ask general diagnostic questions.
4. Do NOT ask exploratory questions.
5. Do NOT ask multiple questions.

When a required parameter is missing, ask ONLY for that specific parameter using the `askHuman` tool.

## Tool Usage Rules

### askHuman
- If you need additional context (logs, class names, method names, reproduction steps, etc.), you MUST use the `askHuman` tool.
- DO NOT ask questions directly in the message without calling this tool.

### Arthas Commands
- You MAY run Arthas commands to collect diagnostic information.
- Before running any Arthas command, you MUST ensure the command will terminate automatically.
- If the command may run indefinitely, you MUST limit it using arguments such as `-n`.
- The value of `-n` must not greater than 3.

Examples:
- `watch ... -n 3`
- `trace ... -n 3`
- `stack ... -n 3`
- `dashboard -n 1`

## Strict Restrictions
- NEVER run Arthas commands that do not terminate automatically.
- NEVER run commands that continuously stream output without a termination condition.
- If you are unsure whether a command will terminate, DO NOT run it.

Always prefer safe, bounded diagnostic commands.""".trimIndent()
        )
        return false
    }

    private fun ensureSystemMessageWithoutSkill(context: AiQueryContext) {
        if (aiConversationStateStore.hasAnyMessage(context.conversationId)) {
            return
        }

        aiConversationStateStore.upsertSystemMessage(
            context.conversationId, """You are a helpful Java troubleshooting assistant.

You are allowed to run Arthas commands to collect runtime information and help the user analyze the issue.

**IMPORTANT**: 
- Do NOT guess or infer additional targets. If the provided information is unclear or incomplete, do not try to "fix" it by guessing.
- Do not search for related terms, synonyms, or alternatives unless the user explicitly instructs you to do so.

## Tool Usage Rules

### askHuman
- If required context is missing for your next step, use `askHuman` to request exactly that missing information.
- Ask only one specific question.

### Arthas Commands

Before running any Arthas command:
- Ensure the command terminates automatically.
- If the command may run continuously, you MUST limit it using arguments like `-n`.
- `-n` must not be greater than 3.

Search rules:
- Only search for the exact class / method / keyword provided by the user or required by the skill.
- Run **at most one search command**.

If the search result does not contain an exact match:
- Stop immediately.
- Do NOT run another search.
- Do NOT attempt spelling corrections or similar names.

Forbidden behaviors:
- guessing alternative identifiers
- fixing typos
- wildcard searches
- partial matches
- repeated searches with modified keywords

If the target cannot be found, report that it may not exist or may be misspelled.

## Strict Restrictions
- Never run commands that can stream output indefinitely without a stop condition.
- If you are unsure whether a command is bounded, do not run it.""".trimIndent()
        )
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
        ensureNotExceededTokenLimit(context.llmConfig.maxTokenPerHour)

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
            .maxCompletionTokens(
                if (context.llmConfig.maxTokenPerHour >= 0) {
                    min(context.llmConfig.maxTokenPerHour, MAX_CONVERSATION_TOKEN)
                } else {
                    MAX_CONVERSATION_TOKEN
                }
            )
            .addSystemMessage(selectionPrompt)
            .addUserMessage(question)

        val response = context.client.chat().completions().create(requestBuilder.build())

        val content = response.choices().firstOrNull()?.message()?.content()?.orElse("").orEmpty().trim()

        val usedTokens = response.usage().getOrNull()?.totalTokens()
            ?: (estimateTokens(selectionPrompt.length + question.length) + estimateTokens(content.length))

        recordTokenUsage(usedTokens)
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
            val usedInCurrentHour = if (usage.epochHour == currentEpochHour) {
                usage.used
            } else {
                0L
            }
            if (usedInCurrentHour >= maxTokenPerHour) {
                throw BusinessException("LLM token 已超每小时上限")
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
                val baseUsed = if (oldUsage.epochHour == currentEpochHour) {
                    oldUsage.used
                } else {
                    0L
                }
                val newUsed = baseUsed + delta
                val newValue = "$currentEpochHour:$newUsed"

                val updatedCount = sysConfigService.updateConfigByIdWithOptimisticCheck(
                    SysConfigIds.LLM_USED,
                    oldValue,
                    newValue,
                )
                if (updatedCount > 0) {
                    return
                }
            }
            throw BusinessException("更新 LLM token 使用量失败，请稍后重试")
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

    private fun sendMessage(context: AiQueryContext, message: AiMessageDTO) {
        context.emitter.send(message)
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
        return sysConfigService.findConfigValue(id) ?: ""
    }
}
