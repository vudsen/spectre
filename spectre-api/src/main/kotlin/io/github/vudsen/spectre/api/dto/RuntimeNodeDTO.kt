package io.github.vudsen.spectre.api.dto

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import java.sql.Timestamp

class RuntimeNodeDTO(
    var id: Long,

    var name: String,

    var pluginId: String,

    var configuration: RuntimeNodeConfig,

    var createdAt: Timestamp,

    var labels: Map<String, String>,

    var restrictedMode: Boolean
) {


}