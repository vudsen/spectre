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
    var id: Long? = null,
    var name: String? = null,
    @Column(name = "created_at", updatable = false, insertable = false)
    @Null
    var createdAt: Timestamp? = null,
    var jattachTag: String? = null,
    var arthasTag: String? = null,
    @Deprecated("Unused field. This tag is bundled in the server")
    @Column(updatable = false, insertable = false)
    var httpClientTag: String? = null
) {

    @PrePersist
    fun prePersist() {
        if (id == null) {
            id = SnowFlake.nextId()
        }
    }

}