package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class LLMConfigurationModifyVO {

    var id: Long? = null

    @NotEmpty
    var provider: String = "OPENAI"

    @NotEmpty
    var model: String = ""

    var baseUrl: String? = null

    var apiKey: String? = null

    var enabled: Boolean = true
}
