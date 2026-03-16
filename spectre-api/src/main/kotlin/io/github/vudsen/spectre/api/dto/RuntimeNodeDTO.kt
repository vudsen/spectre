package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.common.RuntimeNodeConfig
import java.sql.Timestamp

class RuntimeNodeDTO(
    var id: Long,

    var name: String,

    var pluginId: String,

    var configuration: RuntimeNodeConfig,

    var createdAt: Timestamp,

    var labels: Map<String, String>,

    var restrictedMode: Boolean
)