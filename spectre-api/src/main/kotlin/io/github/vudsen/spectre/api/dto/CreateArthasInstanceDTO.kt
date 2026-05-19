package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.common.Jvm
import java.time.Instant

data class CreateArthasInstanceDTO(
    val id: String,
    val channelId: String,
    val endpointPassword: String,
    val boundPort: Int,
    val sessionId: String,
    val runtimeNodeId: Long,
    val restrictedMode: Boolean,
    val bundleId: Long,
    val extPointId: String,
    var jvm: Jvm,
    val lastAccess: Instant,
    val path: List<String> = emptyList(),
)
