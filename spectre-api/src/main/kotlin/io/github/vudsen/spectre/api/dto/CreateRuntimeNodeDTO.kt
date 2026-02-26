package io.github.vudsen.spectre.api.dto

import jakarta.validation.constraints.NotEmpty

class CreateRuntimeNodeDTO {

    @NotEmpty
    var name: String = ""

    @NotEmpty
    var pluginId: String = ""

    var labels: Map<String, String>? = null

    @NotEmpty
    var configuration: String = ""

    var restrictedMode: Boolean? = false

}