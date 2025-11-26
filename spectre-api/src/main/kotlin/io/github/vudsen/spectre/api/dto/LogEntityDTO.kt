package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.repo.po.LogEntityPO
import java.sql.Timestamp

class LogEntityDTO(
    var id: Long,
    var operation: String,
    var isSuccess: Boolean,
    var context: String?,
    var time: Timestamp,
    var ip: String,
    var username: String,
    var userId: Long,
    var userAgent: String,
    var message: String?
) {

    companion object {
        fun LogEntityPO.toDTO(): LogEntityDTO {
            return LogEntityDTO(
                id!!,
                operation!!,
                isSuccess!!,
                context,
                time!!,
                ip!!,
                username!!,
                userId!!,
                userAgent!!,
                message
            )
        }
    }

}