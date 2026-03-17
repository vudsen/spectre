package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.dto.SkillDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.api.vo.LLMConfigurationVO
import io.github.vudsen.spectre.core.vo.AiChatRequestVO
import org.springframework.http.CacheControl
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("ai")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).LLM_READ)")
class AiController(
    private val aiService: AiService,
) {

    @PostMapping("chat", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun chat(@Validated @RequestBody request: AiChatRequestVO): ResponseEntity<SseEmitter> {
        val emitter = SseEmitter(0L)
        aiService.query(request.conversationId, request.channelId, request.query, emitter)
        return streamResponse(emitter)
    }

    @PostMapping("chat/with-skill", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun chatWithSkill(@Validated @RequestBody request: AiChatRequestVO): ResponseEntity<SseEmitter> {
        val emitter = SseEmitter(0L)
        aiService.queryWithSkill(request.conversationId, request.channelId, request.query, emitter, request.skillId)
        return streamResponse(emitter)
    }

    private fun streamResponse(emitter: SseEmitter): ResponseEntity<SseEmitter> {
        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_EVENT_STREAM)
            .cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CONNECTION, "keep-alive")
            // Disable response buffering when serving through nginx.
            .header("X-Accel-Buffering", "no")
            .body(emitter)
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

    @GetMapping("skills")
    fun listSkills(): List<SkillDTO> {
        return aiService.listSkills()
    }

}
