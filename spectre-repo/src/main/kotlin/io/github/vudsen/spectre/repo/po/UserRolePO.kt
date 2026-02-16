package io.github.vudsen.spectre.repo.po

import jakarta.persistence.Column
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate

@Entity
@DynamicUpdate
@Table(name = "user_role")
class UserRolePO {

    @EmbeddedId
    var id: UserRoleId = UserRoleId()

    data class UserRoleId(
        @Column("user_id")
        var userId: Long = 0,
        @Column("role_id")
        var roleId: Long = 0
    )
}