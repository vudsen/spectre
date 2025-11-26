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
    var id: Long? = null

    /**
     * 操作，保存 i18n key
     */
    var operation: String? = null

    /**
     * 是否成功
     */
    var isSuccess: Boolean? = null

    /**
     * 上下文，JSON 格式
     */
    var context: String? = null

    var time: Timestamp? = null

    var ip: String? = null

    var username: String? = null

    var userId: Long? = null

    @Column(name = "user_agent")
    var userAgent: String? = null

    var message: String? = null

    @PrePersist
    fun prePersist() {
        if (id == null) {
            id = SnowFlake.nextId()
        }
    }

}