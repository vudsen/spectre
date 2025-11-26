package io.github.vudsen.spectre.repo.po

import jakarta.persistence.Column
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import jakarta.validation.constraints.Null
import org.hibernate.annotations.DynamicUpdate
import java.sql.Timestamp

@Entity
@DynamicUpdate
@Table(name = "toolchain_item")
data class ToolchainItemPO(
    @EmbeddedId
    var id: ToolchainItemId? = null,
    /**
     * x86 url
     */
    var url: String? = null,
    /**
     * arm url
     */
    var armUrl: String? = null,
    @Null
    @Column(name = "created_at", updatable = false, insertable = false)
    val createdAt: Timestamp? = null,
) {

//
//    fun toDto(): ToolchainItemDTO {
//        return ToolchainItemDTO(
//            id!!.type!!,
//            id!!.tag!!,
//            url!!,
//            armUrl,
//            createdAt!!
//        )
//    }
}