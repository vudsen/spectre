package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.util.RepoConstant
import io.github.vudsen.spectre.repo.util.SnowFlake
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp

@Entity
@DynamicUpdate
@Table(name = "toolchain_bundle")
class ToolchainBundlePO(
    @Id
    var id: Long = 0,
    var name: String = "",
    @Column(name = "created_at", updatable = false, insertable = false)
    var createdAt: Timestamp = Timestamp(System.currentTimeMillis()),
    var jattachTag: String = "",
    var arthasTag: String = "",
) {
    @PrePersist
    fun prePersist() {
        if (id == RepoConstant.EMPTY_ID) {
            id = SnowFlake.nextId()
            createdAt = Timestamp(System.currentTimeMillis())
        }
    }
}
