package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.repo.entity.PolicyPermissionEnhancePlugin
import io.github.vudsen.spectre.repo.entity.SubjectType
import jakarta.validation.constraints.NotEmpty

class CreatePolicyPermissionDTO {
    var subjectType: SubjectType = SubjectType.ROLE

    var subjectId: Long = 0

    @NotEmpty
    var resource: String = ""

    @NotEmpty
    var action: String = ""

    var conditionExpression: String? = null

    var description: String? = null

    var enhancePlugins: List<PolicyPermissionEnhancePlugin> = emptyList()
}
