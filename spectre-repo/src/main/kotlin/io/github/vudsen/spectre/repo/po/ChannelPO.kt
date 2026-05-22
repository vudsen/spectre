package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.util.SnowFlake
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import jakarta.validation.constraints.NotEmpty
import java.time.Instant

/**
 * 频道. 目前仅用于批量操作，单个操作还是使用 [ArthasInstancePO]
 */
@Entity
@Table(name = "channel")
class ChannelPO {
    @Id
    @NotEmpty
    var id: Long = 0

    var instanceIds: List<String> = emptyList()

    var lastAccess: Instant = Instant.MIN

    @PrePersist
    fun prePersist() {
        if (id == 0L) {
            id = SnowFlake.nextId()
        }
        lastAccess = Instant.now()
    }
}
