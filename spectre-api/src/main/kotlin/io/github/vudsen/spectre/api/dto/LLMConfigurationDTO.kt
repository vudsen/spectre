package io.github.vudsen.spectre.api.dto

import com.fasterxml.jackson.annotation.JsonIgnore

class LLMConfigurationDTO(
    var provider: String = "OPENAI",
    var model: String,
    var baseUrl: String,
    @field:JsonIgnore
    var apiKey: String,
    var maxTokenPerHour: Long = -1,
    var enabled: Boolean = true,
)
