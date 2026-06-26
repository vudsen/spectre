package io.github.vudsen.spectre.core.integrate.ai.tool

import io.github.vudsen.spectre.api.ai.AiToolExecutionContext
import io.github.vudsen.spectre.api.ai.TypedAgentTool
import io.github.vudsen.spectre.core.integrate.ai.AiSkillsLoader
import org.springframework.stereotype.Component

@Component
class LoadSkillTool : TypedAgentTool<LoadSkillRequest>() {
    override fun getArgumentType(): Class<LoadSkillRequest> = LoadSkillRequest::class.java

    override fun executeInternal(
        context: AiToolExecutionContext,
        argument: LoadSkillRequest,
    ): String = AiSkillsLoader.loadSkill(argument.skillName)

    override fun getName(): String = "load_skill"

    override fun getDescription(): String = "Load specific skill."

    override fun requireUserConfirm(): Boolean = false

    override fun exposeToolCallResponse(): Boolean = false
}
