package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.api.dto.JvmTreeNodeDTO
import io.github.vudsen.spectre.api.dto.RuntimeNodeTestDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.core.integrate.abac.RuntimeNodePolicyPermissionContext
import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.repo.util.UpdateGroup
import io.github.vudsen.spectre.core.vo.RuntimeNodeExpandRequestVO
import io.github.vudsen.spectre.api.entity.PageDescriptor
import io.github.vudsen.spectre.api.perm.AppPermissions
import io.github.vudsen.spectre.repo.po.RuntimeNodePO
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
@RequestMapping("runtime-node")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_READ)")
class RuntimeNodeController(
    private val service: RuntimeNodeService,
    private val appAccessControlService: AppAccessControlService
) {


    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_UPDATE) or hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_CREATE)")
    @GetMapping("configuration-page")
    fun configurationPage(pluginId: String): PageDescriptor? {
        return service.findPluginById(pluginId)?.getConfigurationForm(null)
    }

    @PostMapping("create")
    @Log("log.runtime_node.create", contextResolveExp = "{ id: #args[0].id }")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_CREATE)")
    fun createRuntimeNode(@RequestBody @Validated(CreateGroup::class) po: RuntimeNodePO) {
        service.saveRuntimeNode(po)
    }

    @Log("log.runtime_node.update", contextResolveExp = "{ id: #args[0].id }")
    @PostMapping("update")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_UPDATE)")
    fun updateRuntimeNode(@RequestBody @Validated(UpdateGroup::class) po: RuntimeNodePO) {
        service.saveRuntimeNode(po)
    }

    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_UPDATE) or hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_CREATE)")
    @PostMapping("test")
    fun testConnection(@RequestBody @Validated testObj: RuntimeNodeTestDTO) {
        service.test(testObj)
    }

    @PostMapping("expand-tree")
    fun expandRuntimeNodeTree(@RequestBody vo: RuntimeNodeExpandRequestVO): List<JvmTreeNodeDTO> {
        val node = service.getRuntimeNode(vo.runtimeNodeId) ?: throw BusinessException("节点不存在")
        val ctx = RuntimeNodePolicyPermissionContext(node, AppPermissions.RUNTIME_NODE_TREE_EXPAND)
        appAccessControlService.checkPolicyPermission(ctx)

        return service.expandRuntimeNodeTree(vo.runtimeNodeId, vo.parentNodeId)
    }

    @PostMapping("delete/{id}")
    @Log("log.runtime_node.delete", contextResolveExp = "{ id: #args[0] }")
    @PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_DELETE)")
    fun delete(@PathVariable id: Long) {
        service.deleteById(id)
    }

    @GetMapping("view")
    fun view(@RequestParam("runtimeNodeId") runtimeNodeId: Long): PageDescriptor {
        return service.resolveViewPage(runtimeNodeId)
    }

}