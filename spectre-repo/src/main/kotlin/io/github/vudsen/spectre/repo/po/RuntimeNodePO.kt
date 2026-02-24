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
    open var id: Long = 0,

    @Column(nullable = false)
    @field:NotEmpty
    open var name: String = "",

    @Column(nullable = false)
    @field:NotEmpty
    open var pluginId: String = "",

    @Convert(converter = LabelsConvert::class)
    open var labels: Map<String, String>? = null,

    @Column(nullable = false)
    @JsonRawValue
    @field:NotEmpty()
    open var configuration: String = "",

    @Column(updatable = false, insertable = false)
    @field:Null
    open var createdAt: Timestamp? = null,

    open var restrictedMode: Boolean? = false

    ) {

    @PrePersist
    fun prePersist() {
        if (id == 0L) {
            id = SnowFlake.nextId()
        }
    }

}