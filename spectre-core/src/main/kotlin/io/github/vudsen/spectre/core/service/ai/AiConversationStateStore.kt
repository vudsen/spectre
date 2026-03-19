package io.github.vudsen.spectre.core.service.ai

import com.openai.models.chat.completions.ChatCompletionAssistantMessageParam
import com.openai.models.chat.completions.ChatCompletionMessageFunctionToolCall
import com.openai.models.chat.completions.ChatCompletionMessageParam
import com.openai.models.chat.completions.ChatCompletionSystemMessageParam
import com.openai.models.chat.completions.ChatCompletionToolMessageParam
import com.openai.models.chat.completions.ChatCompletionUserMessageParam
import io.github.vudsen.spectre.core.configuration.constant.CacheConstant
import org.springframework.cache.Cache
import org.springframework.cache.CacheManager
import org.springframework.stereotype.Component

@Component
class AiConversationStateStore(
    cacheManager: CacheManager,
) {
    enum class StoredMessageType {
        SYSTEM,
        USER,
        ASSISTANT,
        TOOL_RESPONSE,
    }

    data class AssistantToolCall(
        val id: String,
        val name: String,
        val arguments: String,
        val type: String = "function",
    ) {
        constructor() : this("", "", "")
    }

    data class StoredMessage(
        val type: StoredMessageType = StoredMessageType.USER,
        val content: String = "",
        val assistantToolCalls: List<AssistantToolCall> = emptyList(),
        val toolResponseCallId: String? = null,
        val toolResponseName: String? = null,
        val toolResponseData: String? = null,
        val createdAt: Long = System.currentTimeMillis(),
    )

    data class PendingAskHumanState(
        val toolCallId: String,
        val toolName: String,
        val requestJson: String,
        val parameter: String? = null,
        val createdAt: Long = System.currentTimeMillis(),
    ) {
        constructor() : this("", "", "")
    }

    data class PendingToolConfirmState(
        val toolCallId: String,
        val toolName: String,
        val toolArguments: String,
        val parameter: String?,
        val channelId: String,
        val createdAt: Long = System.currentTimeMillis(),
    ) {
        constructor() : this("", "", "", null, "")
    }

    private val cache: Cache = cacheManager.getCache(CacheConstant.DEFAULT_CACHE_KEY)!!

    private fun pendingAskKey(conversationId: String): String = "ai:pending:askHuman:$conversationId"

    private fun pendingToolConfirmKey(conversationId: String): String = "ai:pending:toolConfirm:$conversationId"

    private fun selectedSkillKey(conversationId: String): String = "ai:conversation:selectedSkill:$conversationId"

    private fun messagesKey(conversationId: String): String = "ai:conversation:messages:$conversationId"

    fun savePendingAskHuman(
        conversationId: String,
        toolCallId: String,
        toolName: String,
        requestJson: String,
        parameter: String? = null,
    ) {
        cache.put(
            pendingAskKey(conversationId),
            PendingAskHumanState(
                toolCallId = toolCallId,
                toolName = toolName,
                requestJson = requestJson,
                parameter = parameter,
            ),
        )
    }

    fun getPendingAskHuman(conversationId: String): PendingAskHumanState? =
        cache.get(pendingAskKey(conversationId), PendingAskHumanState::class.java)

    fun takePendingAskHuman(conversationId: String): PendingAskHumanState? {
        val key = pendingAskKey(conversationId)
        val pending = cache.get(key, PendingAskHumanState::class.java)
        cache.evict(key)
        return pending
    }

    fun hasPendingAskHuman(conversationId: String): Boolean =
        cache.get(pendingAskKey(conversationId), PendingAskHumanState::class.java) != null

    fun savePendingToolConfirm(
        conversationId: String,
        toolCallId: String,
        toolName: String,
        toolArguments: String,
        parameter: String?,
        channelId: String,
    ) {
        cache.put(
            pendingToolConfirmKey(conversationId),
            PendingToolConfirmState(toolCallId, toolName, toolArguments, parameter, channelId),
        )
    }

    fun getPendingToolConfirm(conversationId: String): PendingToolConfirmState? =
        cache.get(pendingToolConfirmKey(conversationId), PendingToolConfirmState::class.java)

    fun takePendingToolConfirm(conversationId: String): PendingToolConfirmState? {
        val key = pendingToolConfirmKey(conversationId)
        val pending = cache.get(key, PendingToolConfirmState::class.java)
        cache.evict(key)
        return pending
    }

    fun hasPendingToolConfirm(conversationId: String): Boolean =
        cache.get(pendingToolConfirmKey(conversationId), PendingToolConfirmState::class.java) != null

    fun saveSelectedSkill(
        conversationId: String,
        skillName: String,
    ) {
        cache.put(selectedSkillKey(conversationId), skillName)
    }

    fun getSelectedSkill(conversationId: String): String? = cache.get(selectedSkillKey(conversationId), String::class.java)

    fun clearSelectedSkill(conversationId: String) {
        cache.evict(selectedSkillKey(conversationId))
    }

    fun hasAnyMessage(conversationId: String): Boolean = getStoredMessages(conversationId).isNotEmpty()

    fun upsertSystemMessage(
        conversationId: String,
        content: String,
    ) {
        val messages = getStoredMessages(conversationId).toMutableList()
        val index = messages.indexOfFirst { it.type == StoredMessageType.SYSTEM }
        if (index >= 0) {
            messages[index] = StoredMessage(type = StoredMessageType.SYSTEM, content = content)
        } else {
            messages.add(0, StoredMessage(type = StoredMessageType.SYSTEM, content = content))
        }
        saveStoredMessages(conversationId, messages)
    }

    fun appendUserMessage(
        conversationId: String,
        content: String,
    ) {
        appendStoredMessage(conversationId, StoredMessage(type = StoredMessageType.USER, content = content))
    }

    fun appendAssistantMessage(
        conversationId: String,
        content: String,
        toolCalls: List<AssistantToolCall>,
    ) {
        appendStoredMessage(
            conversationId,
            StoredMessage(
                type = StoredMessageType.ASSISTANT,
                content = content,
                assistantToolCalls = toolCalls,
            ),
        )
    }

    fun appendToolResponseMessage(
        conversationId: String,
        toolCallId: String,
        toolName: String,
        responseData: String,
    ) {
        appendStoredMessage(
            conversationId,
            StoredMessage(
                type = StoredMessageType.TOOL_RESPONSE,
                toolResponseCallId = toolCallId,
                toolResponseName = toolName,
                toolResponseData = responseData,
            ),
        )
    }

    fun buildChatCompletionMessages(conversationId: String): List<ChatCompletionMessageParam> {
        val result = mutableListOf<ChatCompletionMessageParam>()
        for (stored in getStoredMessages(conversationId)) {
            when (stored.type) {
                StoredMessageType.SYSTEM -> {
                    result.add(
                        ChatCompletionMessageParam.ofSystem(
                            ChatCompletionSystemMessageParam
                                .builder()
                                .content(stored.content)
                                .build(),
                        ),
                    )
                }

                StoredMessageType.USER -> {
                    result.add(
                        ChatCompletionMessageParam.ofUser(
                            ChatCompletionUserMessageParam
                                .builder()
                                .content(stored.content)
                                .build(),
                        ),
                    )
                }

                StoredMessageType.ASSISTANT -> {
                    val assistantBuilder = ChatCompletionAssistantMessageParam.builder()
                    if (stored.content.isNotBlank()) {
                        assistantBuilder.content(stored.content)
                    }
                    stored.assistantToolCalls.forEach { toolCall ->
                        val functionToolCall =
                            ChatCompletionMessageFunctionToolCall
                                .builder()
                                .id(toolCall.id)
                                .function(
                                    ChatCompletionMessageFunctionToolCall.Function
                                        .builder()
                                        .name(toolCall.name)
                                        .arguments(toolCall.arguments)
                                        .build(),
                                ).build()
                        assistantBuilder.addToolCall(functionToolCall)
                    }
                    result.add(ChatCompletionMessageParam.ofAssistant(assistantBuilder.build()))
                }

                StoredMessageType.TOOL_RESPONSE -> {
                    result.add(
                        ChatCompletionMessageParam.ofTool(
                            ChatCompletionToolMessageParam
                                .builder()
                                .toolCallId(stored.toolResponseCallId ?: "")
                                .content(stored.toolResponseData ?: "")
                                .build(),
                        ),
                    )
                }
            }
        }

        return result
    }

    private fun appendStoredMessage(
        conversationId: String,
        message: StoredMessage,
    ) {
        val messages = getStoredMessages(conversationId).toMutableList()
        messages.add(message)
        saveStoredMessages(conversationId, messages)
    }

    private fun getStoredMessages(conversationId: String): List<StoredMessage> =
        cache
            .get(messagesKey(conversationId), MutableList::class.java)
            ?.filterIsInstance<StoredMessage>()
            ?.toList()
            ?: emptyList()

    private fun saveStoredMessages(
        conversationId: String,
        messages: List<StoredMessage>,
    ) {
        cache.put(messagesKey(conversationId), messages.toMutableList())
    }
}
