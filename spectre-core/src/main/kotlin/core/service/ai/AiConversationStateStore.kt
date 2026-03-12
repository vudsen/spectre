package io.github.vudsen.spectre.core.service.ai

import io.github.vudsen.spectre.api.entity.AskHumanRequest
import io.github.vudsen.spectre.core.configuration.constant.CacheConstant
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.messages.Message
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.ToolResponseMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.cache.Cache
import org.springframework.cache.CacheManager
import org.springframework.stereotype.Component

@Component
class AiConversationStateStore(
    cacheManager: CacheManager
) {

    enum class StoredMessageType {
        SYSTEM,
        USER,
        ASSISTANT,
        TOOL_RESPONSE,
    }

    data class StoredMessage(
        val type: StoredMessageType,
        val content: String = "",
        val assistantToolCallId: String? = null,
        val assistantToolType: String? = null,
        val assistantToolName: String? = null,
        val assistantToolArguments: String? = null,
        val toolResponseCallId: String? = null,
        val toolResponseName: String? = null,
        val toolResponseData: String? = null,
        val createdAt: Long = System.currentTimeMillis(),
    )

    data class PendingAskHumanState(
        val options: List<String> = emptyList(),
        val createdAt: Long = System.currentTimeMillis(),
    )

    data class PendingToolConfirmState(
        val toolCallId: String,
        val toolName: String,
        val toolArguments: String,
        val parameter: String?,
        val channelId: String,
        val createdAt: Long = System.currentTimeMillis(),
    )

    private val cache: Cache = cacheManager.getCache(CacheConstant.DEFAULT_CACHE_KEY)!!

    private fun pendingAskKey(conversationId: String): String = "ai:pending:askHuman:${conversationId}"

    private fun pendingToolConfirmKey(conversationId: String): String = "ai:pending:toolConfirm:${conversationId}"

    private fun selectedSkillKey(conversationId: String): String = "ai:conversation:selectedSkill:${conversationId}"

    private fun messagesKey(conversationId: String): String = "ai:conversation:messages:${conversationId}"

    fun savePendingAskHuman(conversationId: String, request: AskHumanRequest) {
        cache.put(pendingAskKey(conversationId), PendingAskHumanState(request.options))
    }

    fun takePendingAskHuman(conversationId: String): PendingAskHumanState? {
        val key = pendingAskKey(conversationId)
        val pending = cache.get(key, PendingAskHumanState::class.java)
        cache.evict(key)
        return pending
    }

    fun hasPendingAskHuman(conversationId: String): Boolean {
        return cache.get(pendingAskKey(conversationId), PendingAskHumanState::class.java) != null
    }

    fun savePendingToolConfirm(
        conversationId: String,
        toolCallId: String,
        toolName: String,
        toolArguments: String,
        parameter: String?,
        channelId: String
    ) {
        cache.put(
            pendingToolConfirmKey(conversationId),
            PendingToolConfirmState(toolCallId, toolName, toolArguments, parameter, channelId)
        )
    }

    fun getPendingToolConfirm(conversationId: String): PendingToolConfirmState? {
        return cache.get(pendingToolConfirmKey(conversationId), PendingToolConfirmState::class.java)
    }

    fun takePendingToolConfirm(conversationId: String): PendingToolConfirmState? {
        val key = pendingToolConfirmKey(conversationId)
        val pending = cache.get(key, PendingToolConfirmState::class.java)
        cache.evict(key)
        return pending
    }

    fun hasPendingToolConfirm(conversationId: String): Boolean {
        return cache.get(pendingToolConfirmKey(conversationId), PendingToolConfirmState::class.java) != null
    }

    fun saveSelectedSkill(conversationId: String, skillName: String) {
        cache.put(selectedSkillKey(conversationId), skillName)
    }

    fun getSelectedSkill(conversationId: String): String? {
        return cache.get(selectedSkillKey(conversationId), String::class.java)
    }

    fun clearSelectedSkill(conversationId: String) {
        cache.evict(selectedSkillKey(conversationId))
    }

    fun upsertSystemMessage(conversationId: String, content: String) {
        val messages = getStoredMessages(conversationId).toMutableList()
        val index = messages.indexOfFirst { it.type == StoredMessageType.SYSTEM }
        if (index >= 0) {
            messages[index] = StoredMessage(type = StoredMessageType.SYSTEM, content = content)
        } else {
            messages.add(0, StoredMessage(type = StoredMessageType.SYSTEM, content = content))
        }
        saveStoredMessages(conversationId, messages)
    }

    fun appendUserMessage(conversationId: String, content: String) {
        appendStoredMessage(conversationId, StoredMessage(type = StoredMessageType.USER, content = content))
    }

    fun appendAssistantTextMessage(conversationId: String, content: String) {
        appendStoredMessage(conversationId, StoredMessage(type = StoredMessageType.ASSISTANT, content = content))
    }

    fun appendAssistantToolCallMessage(
        conversationId: String,
        toolCallId: String,
        toolName: String,
        toolArguments: String,
        content: String = ""
    ) {
        appendStoredMessage(
            conversationId,
            StoredMessage(
                type = StoredMessageType.ASSISTANT,
                content = content,
                assistantToolCallId = toolCallId,
                assistantToolType = "function",
                assistantToolName = toolName,
                assistantToolArguments = toolArguments,
            )
        )
    }

    fun appendToolResponseMessage(
        conversationId: String,
        toolCallId: String,
        toolName: String,
        responseData: String
    ) {
        appendStoredMessage(
            conversationId,
            StoredMessage(
                type = StoredMessageType.TOOL_RESPONSE,
                toolResponseCallId = toolCallId,
                toolResponseName = toolName,
                toolResponseData = responseData,
            )
        )
    }

    fun buildChatMessages(conversationId: String): List<Message> {
        val result = mutableListOf<Message>()
        for (stored in getStoredMessages(conversationId)) {
            when (stored.type) {
                StoredMessageType.SYSTEM -> {
                    result.add(SystemMessage(stored.content))
                }

                StoredMessageType.USER -> {
                    result.add(UserMessage(stored.content))
                }

                StoredMessageType.ASSISTANT -> {
                    val toolCallId = stored.assistantToolCallId
                    if (toolCallId.isNullOrBlank()) {
                        result.add(AssistantMessage(stored.content))
                    } else {
                        result.add(
                            AssistantMessage.builder()
                                .content(stored.content)
                                .toolCalls(
                                    listOf(
                                        AssistantMessage.ToolCall(
                                            toolCallId,
                                            stored.assistantToolType ?: "function",
                                            stored.assistantToolName ?: "",
                                            stored.assistantToolArguments ?: "{}",
                                        )
                                    )
                                )
                                .build()
                        )
                    }
                }

                StoredMessageType.TOOL_RESPONSE -> {
                    result.add(
                        ToolResponseMessage.builder()
                            .responses(
                                listOf(
                                    ToolResponseMessage.ToolResponse(
                                        stored.toolResponseCallId ?: "",
                                        stored.toolResponseName ?: "",
                                        stored.toolResponseData ?: "",
                                    )
                                )
                            )
                            .build()
                    )
                }
            }
        }

        return result
    }


    private fun appendStoredMessage(conversationId: String, message: StoredMessage) {
        val messages = getStoredMessages(conversationId).toMutableList()
        messages.add(message)
        saveStoredMessages(conversationId, messages)
    }

    private fun getStoredMessages(conversationId: String): List<StoredMessage> {
        return cache.get(messagesKey(conversationId), MutableList::class.java)
            ?.filterIsInstance<StoredMessage>()
            ?.toList()
            ?: emptyList()
    }

    private fun saveStoredMessages(conversationId: String, messages: List<StoredMessage>) {
        cache.put(messagesKey(conversationId), messages.toMutableList())
    }
}
