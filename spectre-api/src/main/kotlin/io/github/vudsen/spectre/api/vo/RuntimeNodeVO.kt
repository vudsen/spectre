package io.github.vudsen.spectre.api.vo

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import java.sql.Timestamp

class RuntimeNodeVO(
    var id: Long,
    var name: String,
    var pluginId: String,
    var createdAt: Timestamp,
    var labels: Map<String, String>,
    var viewPageName: String,
    var pluginName: String,
)