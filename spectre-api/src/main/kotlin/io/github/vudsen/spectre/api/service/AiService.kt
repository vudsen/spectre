package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.AgentEventPublisher
import io.github.vudsen.spectre.api.dto.AiToolResponseDTO
import io.github.vudsen.spectre.api.dto.SkillDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.vo.LLMConfigurationVO

interface AiService {
    /**
     * 询问 AI
     * @param conversationId 对话 id
     * @param channelId arthas channel id
     * @param message 用户消息
     * @param publisher AI 事件发布者
     * @param forceSkillId 强制加载某个技能
     */
    fun chat(
        conversationId: String,
        channelId: String,
        message: String,
        toolResponses: List<AiToolResponseDTO>,
        publisher: AgentEventPublisher,
        forceSkillId: String?,
    )

    fun getCurrentLLMConfiguration(): LLMConfigurationVO

    fun updateLLMConfiguration(configuration: UpdateLLMConfigurationDTO)

    fun listSkills(): List<SkillDTO>
}
