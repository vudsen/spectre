package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.repo.po.UserPO
import java.sql.Timestamp

class UserDTO(
    var id: Long,
    var username: String,
    var password: String,
    var displayName: String?,
    var labels: Map<String, String>,
    var createdAt: Timestamp
) {

    companion object {
        fun UserPO.toDTO(): UserDTO {
            return UserDTO(id!!, username!!, password!!, displayName, labels!!, createdAt!!)
        }
    }

}