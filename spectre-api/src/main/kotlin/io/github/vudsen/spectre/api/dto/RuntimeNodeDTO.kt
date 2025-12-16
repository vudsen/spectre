package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.repo.po.RuntimeNodePO
import java.sql.Timestamp

class RuntimeNodeDTO(
    var id: Long,

    var name: String,

    var pluginId: String,

    var configuration: String,

    var createdAt: Timestamp,

    var labels: Map<String, String>,

    var restrictedMode: Boolean
) {

    companion object {

        fun RuntimeNodePO.toDTO(): RuntimeNodeDTO {
            return RuntimeNodeDTO(
                id!!,
                name!!,
                pluginId!!,
                configuration!!,
                createdAt!!,
                labels ?: emptyMap(),
                restrictedMode!!
            )
        }

    }
}