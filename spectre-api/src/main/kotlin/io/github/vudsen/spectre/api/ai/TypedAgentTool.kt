package io.github.vudsen.spectre.api.ai

import io.github.vudsen.spectre.common.util.GLOBAL_JSON_MAPPER

abstract class TypedAgentTool<T> : AgentTool {
    abstract override fun getArgumentType(): Class<T>

    protected abstract fun executeInternal(
        context: AiToolExecutionContext,
        argument: T,
    ): String

    override fun execute(
        context: AiToolExecutionContext,
        argument: String,
    ): String = executeInternal(context, GLOBAL_JSON_MAPPER.readValue(argument, getArgumentType()))
}
