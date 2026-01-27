package io.github.vudsen.spectre.api.dto

import com.fasterxml.jackson.annotation.JsonIgnore
import io.github.vudsen.spectre.repo.po.UserPO
import java.sql.Timestamp

class UserDTO(
    var id: Long,
    var username: String,
    @field:JsonIgnore
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