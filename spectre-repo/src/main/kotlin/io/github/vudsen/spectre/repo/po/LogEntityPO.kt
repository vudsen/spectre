package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.util.SnowFlake
import java.sql.Timestamp
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table

@Entity
@Table(name = "log_entity")
class LogEntityPO {

    @Id
    var id: Long = 0

    /**
     * 操作，保存 i18n key
     */
    var operation: String = ""

    /**
     * 是否成功
     */
    var isSuccess: Boolean = false

    /**
     * 上下文，JSON 格式
     */
    var context: String = ""

    var time: Timestamp = Timestamp(System.currentTimeMillis())

    var ip: String = ""

    var username: String = ""

    var userId: Long = 0

    @Column(name = "user_agent")
    var userAgent: String = ""

    var message: String? = null

    @PrePersist
    fun prePersist() {
        if (id == 0L) {
            id = SnowFlake.nextId()
        }
    }

}