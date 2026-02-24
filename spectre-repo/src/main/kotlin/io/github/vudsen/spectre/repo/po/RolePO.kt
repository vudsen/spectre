package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.repo.util.SnowFlake
import io.github.vudsen.spectre.repo.util.UpdateGroup
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Null
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp

@Entity
@DynamicUpdate
@Table(name = "role")
class RolePO {

    @Id
    @Null(groups = [CreateGroup::class])
    @NotNull(groups = [UpdateGroup::class])
    var id: Long = 0

    @Column(unique = true, nullable = false)
    @NotNull(groups = [CreateGroup::class])
    var name: String = ""

    var description: String? = null

    @Column(updatable = false, insertable = false)
    @Null(groups = [UpdateGroup::class])
    var createdAt: Timestamp? = null

//    @ManyToMany
//    @JoinTable(
//        name = "user_role",
//        joinColumns = [JoinColumn(name = "role_id")],
//        inverseJoinColumns = [JoinColumn(name = "user_id")]
//    )
//    var users: MutableList<UserPO> = mutableListOf()

    @PrePersist
    fun prePersist() {
        if (id == 0L) {
            id = SnowFlake.nextId()
        }
    }


}