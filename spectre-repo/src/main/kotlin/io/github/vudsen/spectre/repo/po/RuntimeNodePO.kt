package io.github.vudsen.spectre.repo.po

import com.fasterxml.jackson.annotation.JsonRawValue
import io.github.vudsen.spectre.repo.convert.LabelsConvert
import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.repo.util.SnowFlake
import io.github.vudsen.spectre.repo.util.UpdateGroup
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Null
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp

@Entity
@DynamicUpdate
@Table(name = "runtime_node")
open class RuntimeNodePO (
    @Id
    @field:NotNull(groups = [UpdateGroup::class])
    @field:Null(groups = [CreateGroup::class])
    var id: Long? = null,

    @Column(nullable = false)
    @field:NotEmpty
    var name: String? = null,

    @Column(nullable = false)
    @field:NotEmpty
    var pluginId: String? = null,

    @Convert(converter = LabelsConvert::class)
    var labels: Map<String, String>? = null,

    @Column(nullable = false)
    @JsonRawValue
    @field:NotEmpty
    var configuration: String? = null,

    @Column(updatable = false, insertable = false)
    @field:Null
    var createdAt: Timestamp? = null,

    var restrictedMode: Boolean? = false

    ) {

    @PrePersist
    fun prePersist() {
        if (id == null) {
            id = SnowFlake.nextId()
        }
    }

}