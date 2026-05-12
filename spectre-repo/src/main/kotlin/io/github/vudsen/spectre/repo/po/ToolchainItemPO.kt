package io.github.vudsen.spectre.repo.po

import jakarta.persistence.Column
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp

@Entity
@DynamicUpdate
@Table(name = "toolchain_item")
class ToolchainItemPO(
    @EmbeddedId
    var id: ToolchainItemId,
    /**
     * x86 url
     */
    var url: String,
    /**
     * arm url
     */
    var armUrl: String,
    @Column(name = "created_at", updatable = false)
    val createdAt: Timestamp,
) {
    constructor() : this(ToolchainItemId(), "", "", Timestamp(System.currentTimeMillis()))
}
