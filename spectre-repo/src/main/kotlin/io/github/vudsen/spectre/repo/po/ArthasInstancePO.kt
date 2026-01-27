package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.repo.convert.InstantToStringConverter
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate
import java.time.Instant

@Entity
@Table(name = "arthas_instance")
@DynamicUpdate
class ArthasInstancePO {

    /**
     * 实例id，和节点树节点 id 一致
     */
    @Id
    var id: String? = null

    var channelId: String? = null

    var endpointPassword: String? = null

    var boundPort: Int? = null

    var sessionId: String? = null

    var runtimeNodeId: Long? = null

    var restrictedMode: Boolean? = null

    var bundleId: Long? = null

    var extPointId: String? = null

    var jvm: String? = null

    @Convert(converter = InstantToStringConverter::class)
    var lastAccess: Instant? = null

    @PrePersist
    fun prePersist() {
        if (id == null) {
            lastAccess = Instant.now()
        }
    }

}