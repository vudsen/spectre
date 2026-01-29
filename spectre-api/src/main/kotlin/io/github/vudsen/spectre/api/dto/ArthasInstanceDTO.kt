package io.github.vudsen.spectre.api.dto

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.repo.po.ArthasInstancePO
import java.time.Instant

data class ArthasInstanceDTO(
    val id: String,
    val channelId: String,
    val endpointPassword: String,
    val boundPort: Int,
    /**
     * Arthas 的 session，对应多个 consumer
     */
    val sessionId: String,
    val runtimeNodeId: Long,
    val restrictedMode: Boolean,
    val bundleId: Long,
    val extPointId: String,
    var jvm: Jvm,
    val lastAccess: Instant
) {

    fun toPO(): ArthasInstancePO {
        return ArthasInstancePO().apply {
            this@apply.id = this@ArthasInstanceDTO.id
            this@apply.channelId = this@ArthasInstanceDTO.channelId
            this@apply.endpointPassword = this@ArthasInstanceDTO.endpointPassword
            this@apply.boundPort = this@ArthasInstanceDTO.boundPort
            this@apply.sessionId = this@ArthasInstanceDTO.sessionId
            this@apply.runtimeNodeId = this@ArthasInstanceDTO.runtimeNodeId
            this@apply.restrictedMode = this@ArthasInstanceDTO.restrictedMode
            this@apply.bundleId = this@ArthasInstanceDTO.bundleId
            this@apply.extPointId = this@ArthasInstanceDTO.extPointId
            this@apply.jvm = objectMapper.writerFor(Object::class.java).writeValueAsString(this@ArthasInstanceDTO.jvm)
            this@apply.lastAccess = this@ArthasInstanceDTO.lastAccess
        }
    }

    companion object {

        val objectMapper: ObjectMapper = JsonMapper.builder()
            .activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                    .allowIfSubType(Jvm::class.java)
                    .build(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
            )
            .build();
        fun ArthasInstancePO.toDTO(): ArthasInstanceDTO {
            return ArthasInstanceDTO(
                id!!,
                channelId!!,
                endpointPassword!!,
                boundPort!!,
                sessionId!!,
                runtimeNodeId!!,
                restrictedMode!!,
                bundleId!!,
                extPointId!!,
                objectMapper.readValue(jvm!!, Jvm::class.java),
                lastAccess!!,
            )
        }
    }
}