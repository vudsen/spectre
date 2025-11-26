package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.entity.SubjectType
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate

@Entity
@DynamicUpdate
@Table(name = "static_permission")
class StaticPermissionPO {

    @EmbeddedId
    var id: StaticPermissionId? = null

    data class StaticPermissionId(
        @Enumerated(EnumType.STRING)
        var subjectType: SubjectType? = null,

        var subjectId: Long? = null,

        var resource: String? = null,

        var action: String? = null
    )


}