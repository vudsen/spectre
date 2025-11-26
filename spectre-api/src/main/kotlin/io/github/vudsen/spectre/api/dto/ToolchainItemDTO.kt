package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.repo.entity.ToolchainType
import io.github.vudsen.spectre.repo.po.ToolchainItemPO
import java.sql.Timestamp

class ToolchainItemDTO(
    var type: ToolchainType,
    var tag: String,
    /**
     * x86 url
     */
    var url: String,
    /**
     * arm url
     */
    var armUrl: String? = null,
    val createdAt: Timestamp,
) {

    companion object {
        fun ToolchainItemPO.toDTO(): ToolchainItemDTO {
            return ToolchainItemDTO(
                id!!.type!!,
                id!!.tag!!,
                url!!,
                armUrl,
                createdAt!!
            )
        }
    }
}