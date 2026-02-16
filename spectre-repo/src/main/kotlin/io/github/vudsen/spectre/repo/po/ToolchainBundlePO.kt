package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.util.SnowFlake
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import jakarta.validation.constraints.Null
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp

@Entity
@DynamicUpdate
@Table(name = "toolchain_bundle")
data class ToolchainBundlePO(
    @Id
    var id: Long = 0,
    var name: String = "",
    @Column(name = "created_at", updatable = false, insertable = false)
    @field:Null
    var createdAt: Timestamp = Timestamp(System.currentTimeMillis()),
    var jattachTag: String = "",
    var arthasTag: String = "",
    @Deprecated("Unused field. This tag is bundled in the server")
    @Column(updatable = false, insertable = false)
    var httpClientTag: String = ""
) {

    @PrePersist
    fun prePersist() {
        if (id == 0L) {
            id = SnowFlake.nextId()
        }
    }

}