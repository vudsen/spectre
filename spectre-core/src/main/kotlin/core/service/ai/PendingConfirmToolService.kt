package io.github.vudsen.spectre.core.service.ai

import io.github.vudsen.spectre.api.AiTools
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import org.springframework.stereotype.Component

@Component
class PendingConfirmToolService(
    private val arthasExecutionService: ArthasExecutionService,
) {

    private val confirmRequiredTools: Set<String> = setOf(AiTools.EXECUTE_ARTHAS_COMMAND)

    fun requiresConfirm(toolName: String): Boolean {
        return confirmRequiredTools.contains(toolName)
    }

    fun executePending(pending: AiConversationStateStore.PendingToolConfirmState): String {
        return when (pending.toolName) {
            AiTools.EXECUTE_ARTHAS_COMMAND -> {
                val result = arthasExecutionService.execSync(pending.channelId, pending.parameter.orEmpty())
                result.toString()
            }

            else -> throw IllegalArgumentException("Unsupported pending confirm tool: ${pending.toolName}")
        }
    }

    fun skipPending(pending: AiConversationStateStore.PendingToolConfirmState): String {
        return "{\"skipped\":true,\"tool\":\"${pending.toolName}\"}"
    }
}
