package io.github.vudsen.spectre.api.dto

import java.time.Instant

class LLMConfigurationDTO(
    var id: Long? = null,
    var provider: String = "OPENAI",
    var model: String = "",
    var baseUrl: String? = null,
    var apiKey: String? = null,
    var enabled: Boolean = true,
    var createdAt: Instant? = null,
    var lastUpdate: Instant? = null,
)
