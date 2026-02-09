package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.api.perm.AppPermissions
import io.github.vudsen.spectre.repo.entity.PolicyPermissionEnhancePlugin
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.PolicyPermissionPO
import java.sql.Timestamp

class PolicyPermissionDTO(
    var id: Long,
    var subjectType: SubjectType,
    var subjectId: Long,
    var resource: String,
    var action: String,
    var conditionExpression: String,
    var description: String?,
    var createdAt: Timestamp,
    var name: String,
    /**
     * @see [io.github.vudsen.spectre.api.plugin.EnhancePolicyAuthenticationExtensionPoint]
     */
    var enhancePlugins: List<PolicyPermissionEnhancePlugin> = emptyList()
) {

    companion object {
        fun PolicyPermissionPO.toDTO(): PolicyPermissionDTO {
            return PolicyPermissionDTO(
                id!!,
                subjectType!!,
                subjectId!!,
                resource!!,
                action!!,
                conditionExpression!!,
                description,
                createdAt!!,
                AppPermissions.findByResourceAndActions(resource!!, action!!)!!.name,
                enhancePlugins
            )
        }
    }
}

