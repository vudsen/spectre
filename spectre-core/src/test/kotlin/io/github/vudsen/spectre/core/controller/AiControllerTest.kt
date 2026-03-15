package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.dto.AiMessageDTO
import io.github.vudsen.spectre.api.dto.UpdateLLMConfigurationDTO
import io.github.vudsen.spectre.api.service.AiService
import io.github.vudsen.spectre.api.vo.LLMConfigurationVO
import io.github.vudsen.spectre.core.vo.AiChatRequestVO
import org.junit.jupiter.api.Assertions.assertArrayEquals
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.http.codec.ServerSentEvent
import reactor.core.publisher.Flux

class AiControllerTest {

    @Test
    fun chat_shouldDelegateToQuery() {
        val aiService = RecordingAiService()
        val controller = AiController(aiService)
        val request = newRequest("hello")

        val result = controller.chat(request).body?.collectList()?.block() ?: emptyList()

        assertEquals("query", aiService.lastMethod)
        assertEquals("conv-1", aiService.lastConversationId)
        assertEquals("channel-1", aiService.lastChannelId)
        assertEquals("hello", aiService.lastQuestion)
        assertEquals(AiMessageDTO.MessageType.TOKEN, result.first().data()!!.type)
    }

    @Test
    fun chatWithSkill_shouldDelegateToQueryWithSkill() {
        val aiService = RecordingAiService()
        val controller = AiController(aiService)
        val request = newRequest("hello skill")

        val result = controller.chatWithSkill(request).body?.collectList()?.block() ?: emptyList<ServerSentEvent<AiMessageDTO>>()

        assertEquals("queryWithSkill", aiService.lastMethod)
        assertEquals("conv-1", aiService.lastConversationId)
        assertEquals("channel-1", aiService.lastChannelId)
        assertEquals("hello skill", aiService.lastQuestion)
        assertEquals(AiMessageDTO.MessageType.TOKEN, result.first().data()!!.type)
    }

    @Test
    fun postMapping_shouldExposeExpectedPaths() {
        val chatMapping = AiController::class.java.getDeclaredMethod("chat", AiChatRequestVO::class.java)
            .getAnnotation(PostMapping::class.java)
        val chatWithSkillMapping = AiController::class.java.getDeclaredMethod("chatWithSkill", AiChatRequestVO::class.java)
            .getAnnotation(PostMapping::class.java)

        assertArrayEquals(arrayOf("chat"), chatMapping.value)
        assertArrayEquals(arrayOf(MediaType.TEXT_EVENT_STREAM_VALUE), chatMapping.produces)
        assertArrayEquals(arrayOf("chat/with-skill"), chatWithSkillMapping.value)
        assertArrayEquals(arrayOf(MediaType.TEXT_EVENT_STREAM_VALUE), chatWithSkillMapping.produces)
    }

    private fun newRequest(query: String): AiChatRequestVO {
        return AiChatRequestVO().also {
            it.conversationId = "conv-1"
            it.channelId = "channel-1"
            it.query = query
        }
    }

    private class RecordingAiService : AiService {
        var lastMethod: String = ""
        var lastConversationId: String = ""
        var lastChannelId: String = ""
        var lastQuestion: String = ""

        override fun query(conversationId: String, channelId: String, question: String): Flux<AiMessageDTO> {
            lastMethod = "query"
            lastConversationId = conversationId
            lastChannelId = channelId
            lastQuestion = question
            return Flux.just(AiMessageDTO(AiMessageDTO.MessageType.TOKEN, "ok"))
        }

        override fun queryWithSkill(conversationId: String, channelId: String, question: String): Flux<AiMessageDTO> {
            lastMethod = "queryWithSkill"
            lastConversationId = conversationId
            lastChannelId = channelId
            lastQuestion = question
            return Flux.just(AiMessageDTO(AiMessageDTO.MessageType.TOKEN, "ok"))
        }

        override fun getCurrentLLMConfiguration(): LLMConfigurationVO? = null

        override fun updateLLMConfiguration(configuration: UpdateLLMConfigurationDTO) {
        }
    }
}
