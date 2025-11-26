package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.convert.PolicyPermissionEnhancePluginConverter
import io.github.vudsen.spectre.repo.entity.PolicyPermissionEnhancePlugin
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.repo.util.SnowFlake
import io.github.vudsen.spectre.repo.util.UpdateGroup
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Null
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp

@Entity
@DynamicUpdate
@Table(name = "policy_permission")
class PolicyPermissionPO {

    @Id
    @Null(groups = [CreateGroup::class])
    @NotNull(groups = [UpdateGroup::class])
    var id: Long? = null

    @Enumerated(EnumType.STRING)
    @NotNull(groups = [CreateGroup::class])
    @Null(groups = [UpdateGroup::class])
    @Column(updatable = false)
    var subjectType: SubjectType? = null

    @NotNull(groups = [CreateGroup::class])
    @Null(groups = [UpdateGroup::class])
    @Column(updatable = false)
    var subjectId: Long? = null

    @NotNull(groups = [CreateGroup::class])
    @Null(groups = [UpdateGroup::class])
    @Column(updatable = false)
    var resource: String? = null

    @NotNull(groups = [CreateGroup::class])
    @Null(groups = [UpdateGroup::class])
    @Column(updatable = false)
    var action: String? = null

    var conditionExpression: String? = null

    var description: String? = null

    @Column(name = "created_at", insertable = false, updatable = false)
    var createdAt: Timestamp? = null

    @Convert(converter = PolicyPermissionEnhancePluginConverter::class)
    var enhancePlugins: List<PolicyPermissionEnhancePlugin> = emptyList()

    @PrePersist
    fun prePersist() {
        if (id == null) {
            id = SnowFlake.nextId()
        }
    }

}