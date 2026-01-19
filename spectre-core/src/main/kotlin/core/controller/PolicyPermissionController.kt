package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.api.service.PolicyPermissionService
import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.repo.util.UpdateGroup
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.perm.ABACPermissions
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.repo.po.PolicyPermissionPO
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("permission/policy")
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).PERMISSION_READ)")
class PolicyPermissionController(
    private val policyPermissionService: PolicyPermissionService

) {

    @GetMapping("permissions")
    fun listAllPolicyPermissions(): Set<PermissionEntity> {
        return policyPermissionService.listAllPermissions()
    }

    @PostMapping("create")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).PERMISSION_BIND)")
    @Log("log.policy_perm.create", contextResolveExp = "pickAttributes(#args[0], 'id', 'subjectType', 'subjectId', 'resource', 'action', 'conditionExpression')")
    fun createPolicy(@RequestBody @Validated(CreateGroup::class) policy: PolicyPermissionPO) {
        policyPermissionService.save(policy)
    }

    @PostMapping("update")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).PERMISSION_BIND)")
    @Log("log.policy_perm.update", contextResolveExp = "pickAttributes(#args[0], 'id', 'conditionExpression')")
    fun updatePolicy(@RequestBody @Validated(UpdateGroup ::class) policy: PolicyPermissionPO) {
        policyPermissionService.save(policy)
    }

    @GetMapping("enhance-pages")
    fun resolveEnhanceConfigurationPage(@RequestParam resource: String, @RequestParam action: String): List<PageDescriptor> {
        val entity = ABACPermissions.findByResourceAndActions(resource, action)
        return policyPermissionService.resolveEnhanceConfigurationPage(entity)
    }

    @PostMapping("delete/{id}")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).PERMISSION_BIND)")
    @Log("log.policy_perm.delete", contextResolveExp = "{id: #args[0]}")
    fun deletePermission(@PathVariable id: Long) {
        policyPermissionService.deletePermission(id)
    }


}