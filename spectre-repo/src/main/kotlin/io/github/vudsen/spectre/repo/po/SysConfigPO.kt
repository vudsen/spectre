package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.util.SnowFlake
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp

@Entity
@DynamicUpdate
@Table(name = "sys_conf")
class SysConfigPO {

    @Id
    var id: Long? = null

    var code: String? = null

    var value: String? = null

    var lastUpdate: Timestamp? = null

    @PrePersist
    fun prePersist() {
        if (id == null) {
            id = SnowFlake.nextId()
        }
    }

    @PreUpdate
    fun preUpdate() {
        lastUpdate = Timestamp(System.currentTimeMillis())
    }

}