package io.github.vudsen.spectre.repo.po

import io.github.vudsen.spectre.common.Jvm
import io.github.vudsen.spectre.repo.convert.ArthasInstanceJvmConverter
import io.github.vudsen.spectre.repo.convert.InstantToStringConverter
import io.github.vudsen.spectre.repo.convert.StringListConverter
import io.github.vudsen.spectre.repo.entity.EmptyJvm
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
open class ArthasInstancePO() {
    /**
     * 实例id，和**节点树节点 id 一致**
     */
    @Id
    open var id: String = ""

    open var endpointPassword: String = ""

    open var boundPort: Int = 0

    /**
     * Arthas 的会话 id
     */
    open var sessionId: String = ""

    open var runtimeNodeId: Long = 0

    open var restrictedMode: Boolean = true

    open var bundleId: Long = 0

    open var extPointId: String = ""

    @Convert(converter = ArthasInstanceJvmConverter::class)
    open var jvm: Jvm = EmptyJvm()

    @Convert(converter = InstantToStringConverter::class)
    open var lastAccess: Instant = Instant.now()

    /**
     * 在节点树中的路径
     */
    @Convert(converter = StringListConverter::class)
    open var paths: List<String> = emptyList()

    constructor(
        path: List<String>,
        jvm: Jvm,
        extPointId: String,
        bundleId: Long,
        restrictedMode: Boolean,
        runtimeNodeId: Long,
        sessionId: String,
        boundPort: Int,
        endpointPassword: String,
        id: String,
    ) : this() {
        this.paths = path
        this.jvm = jvm
        this.extPointId = extPointId
        this.bundleId = bundleId
        this.restrictedMode = restrictedMode
        this.runtimeNodeId = runtimeNodeId
        this.sessionId = sessionId
        this.boundPort = boundPort
        this.endpointPassword = endpointPassword
        this.id = id
    }

    @PrePersist
    fun prePersist() {
        if (paths.isEmpty()) {
            throw IllegalStateException("'path' is empty")
        }
    }
}
