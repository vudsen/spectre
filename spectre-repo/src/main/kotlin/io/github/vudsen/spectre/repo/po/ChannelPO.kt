package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.convert.InstantToStringConverter
import io.github.vudsen.spectre.repo.convert.StringListConverter
import io.github.vudsen.spectre.repo.util.SnowFlake
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import java.time.Instant

/**
 * 频道. 目前仅用于批量操作，单个操作还是使用 [ArthasInstancePO]
 */
@Entity
@Table(name = "channel")
class ChannelPO {
    @Id
    var id: Long = 0

    @Convert(converter = StringListConverter::class)
    var instanceIds: List<String> = emptyList()

    @Convert(converter = InstantToStringConverter::class)
    var lastAccess: Instant = Instant.MIN

    @PrePersist
    fun prePersist() {
        if (id == 0L) {
            id = SnowFlake.nextId()
        }
        lastAccess = Instant.now()
    }
}
