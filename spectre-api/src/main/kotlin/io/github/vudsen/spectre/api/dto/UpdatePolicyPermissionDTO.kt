package io.github.vudsen.spectre.api.dto

import io.github.vudsen.spectre.repo.entity.PolicyPermissionEnhancePlugin
import jakarta.validation.constraints.NotEmpty

class UpdatePolicyPermissionDTO {
    var id: Long = -1

    @NotEmpty
    var conditionExpression: String = ""

    var description: String? = null

    var enhancePlugins: List<PolicyPermissionEnhancePlugin> = emptyList()
}
