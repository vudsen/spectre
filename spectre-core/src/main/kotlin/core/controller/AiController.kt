package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.api.vo.LLMConfigurationVO
import io.github.vudsen.spectre.core.vo.AiChatRequestVO
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
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).LLM_READ)")
class AiController(
    private val aiService: AiService,
) {

    @PostMapping("chat", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun chat(@Validated @RequestBody request: AiChatRequestVO): Flux<AiMessageDTO> {
        return aiService.query(request.conversationId, request.channelId, request.query)
    }

    @PostMapping("chat/with-skill", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun chatWithSkill(@Validated @RequestBody request: AiChatRequestVO): Flux<AiMessageDTO> {
        return aiService.queryWithSkill(request.conversationId, request.channelId, request.query)
    }

    @GetMapping("llm-config/current")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).LLM_READ)")
    fun currentLLMConfiguration(): LLMConfigurationVO? {
        return aiService.getCurrentLLMConfiguration()
    }

    @PostMapping("llm-config")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).LLM_UPDATE)")
    fun saveLLMConfiguration(@Validated @RequestBody request: UpdateLLMConfigurationDTO) {
        aiService.updateLLMConfiguration(request)
    }
}
