package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.api.dto.PermissionResourceDTO
import io.github.vudsen.spectre.api.service.StaticPermissionService
import io.github.vudsen.spectre.core.vo.StaticPermissionModifyVO
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.repo.po.StaticPermissionPO
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("permission/static")
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).PERMISSION_READ)")
class StaticPermissionController(
    private val staticPermissionService: StaticPermissionService
) {



    @GetMapping("resources")
    fun listResources(): List<PermissionResourceDTO> {
        return staticPermissionService.listPermissionResources()
    }

    @GetMapping("find-by-name")
    fun listPermissionByResourceName(resourceName: String): Set<PermissionEntity> {
        return staticPermissionService.findPermissionsByResourceName(resourceName)
    }

    @PostMapping("save-all")
    @Log("log.static_perm.modify", contextResolveExp = "#args[0]")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).PERMISSION_BIND)")
    fun saveStaticPermissions(@Validated @RequestBody modifications: List<StaticPermissionModifyVO>) {
        val insertions = mutableListOf<StaticPermissionPO>()
        val deletions = mutableListOf<StaticPermissionPO.StaticPermissionId>()
        for (modification in modifications) {
            val id = StaticPermissionPO.StaticPermissionId(modification.subjectType, modification.subjectId!!.toLong(), modification.resource, modification.action)
            if (modification.enabled) {
                insertions.add(StaticPermissionPO().apply {
                    this.id = id
                })
            } else {
                deletions.add(id)
            }
        }
        staticPermissionService.modifyPermissions(insertions, deletions)
    }

}