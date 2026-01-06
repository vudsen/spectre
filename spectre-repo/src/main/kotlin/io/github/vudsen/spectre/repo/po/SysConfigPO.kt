package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.convert.InstantToStringConverter
import io.github.vudsen.spectre.repo.util.SnowFlake
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp
import java.time.Instant

@Entity
@DynamicUpdate
@Table(name = "sys_conf")
class SysConfigPO {

    @Id
    var id: Long? = null

    var code: String? = null

    var value: String? = null

    @Convert(converter = InstantToStringConverter::class)
    var lastUpdate: Instant? = null

    @PrePersist
    fun prePersist() {
        if (id == null) {
            id = SnowFlake.nextId()
        }
    }

    @PreUpdate
    fun preUpdate() {
        lastUpdate = Instant.now()
    }

}