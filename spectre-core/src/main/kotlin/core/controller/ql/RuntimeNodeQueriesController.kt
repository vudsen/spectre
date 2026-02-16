package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.core.bean.PageResult
import io.github.vudsen.spectre.core.bean.toPageResult
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.core.vo.RuntimeNodePluginVO
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller

@Controller
@SchemaMapping(typeName = "RuntimeNodeQueries")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_READ)")
class RuntimeNodeQueriesController(
    private val service: RuntimeNodeService
) {


    object RuntimeNodeQueries

    @QueryMapping
    fun runtimeNode(): RuntimeNodeQueries {
        return RuntimeNodeQueries
    }


    @SchemaMapping
    fun runtimeNodes(@Argument page: Int, @Argument size: Int): PageResult<RuntimeNodeDTO> {
        val page = service.listRuntimeNodes(page, size)
        return page.toPageResult()
    }

    @SchemaMapping
    fun runtimeNode(@Argument id: String?): RuntimeNodeDTO? {
        id ?: return null
        return service.getRuntimeNode(id.toLong())
    }

    private fun mapPluginToVo(ext: RuntimeNodeExtensionPoint): RuntimeNodePluginVO {
        return RuntimeNodePluginVO(ext.getId(), ext.name, ext.getDescription(), ext.getConfigurationForm(null))
    }

    @SchemaMapping
    fun plugin(@Argument pluginId: String): RuntimeNodePluginVO? {
        return mapPluginToVo(service.findPluginById(pluginId))
    }

    @SchemaMapping
    fun plugins(): List<RuntimeNodePluginVO> {
        return service.listPlugins().map { extensionPoint -> mapPluginToVo(extensionPoint) }
    }

}