package io.github.vudsen.spectre.api.ai

interface AgentTool {
    fun getArgumentType(): Class<*>

    fun getName(): String

    fun getDescription(): String

    /**
     * 是否需要用户同意后才能执行
     */
    fun requireUserConfirm(): Boolean

    /**
     * 执行工具调用
     */
    fun execute(
        context: AiToolExecutionContext,
        argument: String,
    ): String
}
