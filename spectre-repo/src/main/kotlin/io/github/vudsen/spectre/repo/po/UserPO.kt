package io.github.vudsen.spectre.repo.po

import com.fasterxml.jackson.annotation.JsonIgnore
import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.repo.util.SnowFlake
import io.github.vudsen.spectre.repo.util.UpdateGroup
import io.github.vudsen.spectre.repo.convert.LabelsConvert
import jakarta.persistence.*
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Null
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp


@Entity
@DynamicUpdate
@Table(name = "user")
class UserPO {

    @Id
    @Null(groups = [CreateGroup::class])
    @NotNull(groups = [UpdateGroup::class])
    var id: Long = 0

    @Column(unique = true, updatable = false)
    @NotNull(groups = [CreateGroup::class])
    @Null(groups = [UpdateGroup::class])
    var username: String = ""

    @NotNull(groups = [CreateGroup::class])
    @Null(groups = [UpdateGroup::class])
    @Column(updatable = false)
    var password: String = ""

    @Column(name = "display_name")
    var displayName: String? = null

    @Convert(converter = LabelsConvert::class)
    var labels: Map<String, String>? = null

    @Column(name = "created_at", updatable = false, insertable = false)
    @Null
    var createdAt: Timestamp = Timestamp(System.currentTimeMillis())

    @ManyToMany
    @JsonIgnore
    @Column(updatable = false)
    @JoinTable(
        name = "user_role",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")]
    )
    var roles: MutableList<RolePO> = mutableListOf()

    @PrePersist
    fun prePersist() {
        if (id == 0L) {
            id = SnowFlake.nextId()
        }
    }

}