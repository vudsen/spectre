package io.github.vudsen.spectre.api.dto

import jakarta.validation.constraints.NotEmpty

class RuntimeNodeTestDTO{
    @NotEmpty
    var pluginId: String = ""
    @NotEmpty
    var configuration: String = ""
    var runtimeNodeId: String? = null
}