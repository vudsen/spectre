package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.api.service.LLMConfigurationService
import io.github.vudsen.spectre.core.vo.AiChatRequestVO
import io.github.vudsen.spectre.core.vo.LLMConfigurationModifyVO
import org.springframework.http.MediaType
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux

@RestController
@RequestMapping("ai")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_READ)")
class AiController(
    private val aiService: AiService,
    private val llmConfigurationService: LLMConfigurationService,
) {

    @PostMapping("chat", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun chat(@Validated @RequestBody request: AiChatRequestVO): Flux<AiMessageDTO> {
        return aiService.query(request.conversationId, request.channelId, request.query)
    }

    @GetMapping("llm-config/current")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).ALL)")
    fun currentLLMConfiguration(): LLMConfigurationDTO? {
        return llmConfigurationService.getCurrent()
    }

    @PostMapping("llm-config")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).ALL)")
    fun saveLLMConfiguration(@Validated @RequestBody request: LLMConfigurationModifyVO): LLMConfigurationDTO {
        return llmConfigurationService.saveOrUpdate(
            LLMConfigurationDTO(
                id = request.id,
                provider = request.provider,
                model = request.model,
                baseUrl = request.baseUrl,
                apiKey = request.apiKey,
                enabled = request.enabled,
            )
        )
    }
}
