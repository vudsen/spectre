package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.SkillDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.vo.LLMConfigurationVO
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

interface AiService {
    /**
     * 询问 AI
     */
    fun query(
        conversationId: String,
        channelId: String,
        question: String,
        emitter: SseEmitter,
    )

    /**
     * 询问 AI（启用 Skill）
     * @param selectedSkillId 已选的技能id，如果为空，则调用 LLM 自己选择
     */
    fun queryWithSkill(
        conversationId: String,
        channelId: String,
        question: String,
        emitter: SseEmitter,
        selectedSkillId: String?,
    )

    fun getCurrentLLMConfiguration(): LLMConfigurationVO?

    fun updateLLMConfiguration(configuration: UpdateLLMConfigurationDTO)

    fun listSkills(): List<SkillDTO>
}
