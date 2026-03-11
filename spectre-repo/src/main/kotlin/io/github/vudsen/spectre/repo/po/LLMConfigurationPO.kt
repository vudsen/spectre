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
import java.time.Instant

@Entity
@DynamicUpdate
@Table(name = "llm_configuration")
class LLMConfigurationPO {

    @Id
    var id: Long? = null

    var provider: String = "OPENAI"

    var model: String = ""

    var baseUrl: String? = null

    var apiKey: String? = null

    var enabled: Boolean = true

    @Convert(converter = InstantToStringConverter::class)
    var createdAt: Instant? = null

    @Convert(converter = InstantToStringConverter::class)
    var lastUpdate: Instant? = null

    @PrePersist
    fun prePersist() {
        if (id == null) {
            id = SnowFlake.nextId()
        }
        val now = Instant.now()
        if (createdAt == null) {
            createdAt = now
        }
        lastUpdate = now
    }

    @PreUpdate
    fun preUpdate() {
        lastUpdate = Instant.now()
    }

}
