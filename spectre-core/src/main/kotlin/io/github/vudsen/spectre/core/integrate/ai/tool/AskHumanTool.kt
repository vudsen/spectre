package io.github.vudsen.spectre.core.integrate.ai.tool

import io.github.vudsen.spectre.api.ai.AiToolExecutionContext
import io.github.vudsen.spectre.api.ai.TypedAgentTool
import org.springframework.stereotype.Component

@Component
class AskHumanTool : TypedAgentTool<AskHumanRequest>() {
    companion object {
        const val NAME = "ask_human"
    }

    override fun getName(): String = NAME

    override fun getDescription(): String = "Ask human for answer"

    override fun getArgumentType(): Class<AskHumanRequest> = AskHumanRequest::class.java

    override fun executeInternal(
        context: AiToolExecutionContext,
        argument: AskHumanRequest,
    ): String = ""

    override fun requireUserConfirm(): Boolean = false
}
