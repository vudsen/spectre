package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.api.vo.LLMConfigurationVO
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller

@Controller
@SchemaMapping(typeName = "AIQueries")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).LLM_READ)")
class AIQueriesController(
    private val aiService: AiService,
) {
    object AIQueries

    @QueryMapping(name = "ai")
    fun ai(): AIQueries = AIQueries

    @SchemaMapping
    fun config(): LLMConfigurationVO = aiService.getCurrentLLMConfiguration()
}
