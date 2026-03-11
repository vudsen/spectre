package io.github.vudsen.spectre.core.service.ai

import io.github.vudsen.spectre.api.entity.AskHumanRequest
import io.github.vudsen.spectre.core.configuration.constant.CacheConstant
import org.springframework.cache.Cache
import org.springframework.cache.CacheManager
import org.springframework.stereotype.Component

@Component
class AiConversationStateStore(
    cacheManager: CacheManager
) {

    data class PendingAskHumanState(
        val options: List<String> = emptyList(),
        val createdAt: Long = System.currentTimeMillis(),
    )

    private val cache: Cache = cacheManager.getCache(CacheConstant.DEFAULT_CACHE_KEY)!!

    private fun pendingAskKey(conversationId: String): String = "ai:pending:askHuman:${conversationId}"

    private fun channelKey(conversationId: String): String = "ai:conversation:channel:${conversationId}"

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

    fun bindChannel(conversationId: String, channelId: String) {
        cache.put(channelKey(conversationId), channelId)
    }

    fun resolveChannel(conversationId: String): String? {
        return cache.get(channelKey(conversationId), String::class.java)
    }
}
