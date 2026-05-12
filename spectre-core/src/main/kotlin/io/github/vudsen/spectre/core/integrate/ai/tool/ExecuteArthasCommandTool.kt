package io.github.vudsen.spectre.core.integrate.ai.tool

import io.github.vudsen.spectre.api.ai.AiToolExecutionContext
import io.github.vudsen.spectre.api.ai.TypedAgentTool
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import org.springframework.stereotype.Component

@Component
class ExecuteArthasCommandTool(
    private val arthasExecutionService: ArthasExecutionService,
) : TypedAgentTool<ExecuteArthasCommandRequest>() {
    override fun getName(): String = "execute_arthas_command"

    override fun getDescription(): String = "Execute arthas command"

    override fun getArgumentType(): Class<ExecuteArthasCommandRequest> = ExecuteArthasCommandRequest::class.java

    override fun executeInternal(
        context: AiToolExecutionContext,
        argument: ExecuteArthasCommandRequest,
    ): String = arthasExecutionService.execSync(context.channelId, argument.command).toString()

    override fun requireUserConfirm(): Boolean = true
}
