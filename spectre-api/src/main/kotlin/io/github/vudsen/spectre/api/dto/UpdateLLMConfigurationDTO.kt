package io.github.vudsen.spectre.api.dto

class UpdateLLMConfigurationDTO {

    var apiKey: String? = null

    var model: String? = null

    var baseUrl: String? = null

    var maxTokenPerHour: Long? = null

    var enabled: Boolean? = null

}