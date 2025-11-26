package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.api.perm.ACLPermissions
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.StaticPermissionPO

open class StaticPermissionDTO(
    var subjectId: Long,

    /**
     * 主体类型
     */
    var subjectType: SubjectType,
    /**
     * See [io.github.vudsen.spectre.api.perm.ACLPermissions]
     */
    var resource: String,
    /**
     * See [io.github.vudsen.spectre.api.perm.ACLPermissions]
     */
    var action: String,
    /**
     * 用于展示的名称
     */
    var name: String
) {
    companion object {
        fun StaticPermissionPO.toDTO(): StaticPermissionDTO {
            val id = id!!
            val name = ACLPermissions.findByResourceAndActions(id.resource!!, id.action!!).name
            return StaticPermissionDTO(
                id.subjectId!!,
                id.subjectType!!,
                id.resource!!,
                id.action!!,
                name
            )
        }
    }

}