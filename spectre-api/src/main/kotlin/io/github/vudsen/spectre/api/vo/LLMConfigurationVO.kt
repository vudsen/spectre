package io.github.vudsen.spectre.api.vo

import java.time.Instant

class LLMConfigurationVO(
    val baseUrl: String,
    val model: String,
    val maxTokenPerHour: Long,
    val enabled: Boolean = true,
    val currentUsed: Long,
    val nextRefresh: Instant,
)
