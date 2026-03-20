package io.github.vudsen.spectre.repo.po

import com.fasterxml.jackson.annotation.JsonRawValue
import io.github.vudsen.spectre.repo.convert.LabelsConvert
import io.github.vudsen.spectre.repo.util.SnowFlake
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp

@Entity
@DynamicUpdate
@Table(name = "runtime_node")
open class RuntimeNodePO(
    @Id
    open var id: Long = 0,
    @Column(nullable = false)
    open var name: String = "",
    @Column(nullable = false)
    open var pluginId: String = "",
    @Convert(converter = LabelsConvert::class)
    open var labels: Map<String, String>? = null,
    @Column(nullable = false)
    @JsonRawValue
    open var configuration: String = "",
    @Column(updatable = false, insertable = false)
    open var createdAt: Timestamp? = null,
    open var restrictedMode: Boolean? = false,
) {
    @PrePersist
    fun prePersist() {
        if (id == 0L) {
            id = SnowFlake.nextId()
        }
    }
}
