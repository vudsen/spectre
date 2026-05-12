package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.AgentEventPublisher
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
     * @param selectedSkillId 选中的技能 id
     */
    fun chat(
        conversationId: String,
        channelId: String,
        message: String,
        publisher: AgentEventPublisher,
        selectedSkillId: String?,
    )

    fun getCurrentLLMConfiguration(): LLMConfigurationVO

    fun updateLLMConfiguration(configuration: UpdateLLMConfigurationDTO)

    fun listSkills(): List<SkillDTO>
}
