package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.core.bean.PageResult
import io.github.vudsen.spectre.core.bean.emptyResult
import io.github.vudsen.spectre.core.bean.toPageResult
import io.github.vudsen.spectre.api.service.ToolchainService
import io.github.vudsen.spectre.repo.entity.ToolchainType
import io.github.vudsen.spectre.repo.po.ToolchainBundlePO
import io.github.vudsen.spectre.repo.po.ToolchainItemPO
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller

@Controller
@SchemaMapping(typeName = "ToolchainItemQueries")
class ToolchainQueriesController(
    private val toolchainService: ToolchainService
) {

    object ToolchainItemQueries

    @QueryMapping
    fun toolchain(): ToolchainItemQueries {
        return ToolchainItemQueries
    }

    @SchemaMapping
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).TOOL_CHAIN_READ)")
    fun toolchainItems(@Argument type: String, @Argument page: Int, @Argument size: Int): PageResult<ToolchainItemPO> {
        try {

            return toolchainService.listToolchainItems(ToolchainType.valueOf(type), page, size).toPageResult()
        } catch (e: IllegalArgumentException) {
            return emptyResult()
        }
    }

    @SchemaMapping
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).TOOL_CHAIN_BUNDLE_READ)")
    fun toolchainBundles(@Argument page: Int, @Argument size: Int): PageResult<ToolchainBundlePO> {
        return toolchainService.listToolchainBundles(page, size).toPageResult()
    }

    @SchemaMapping
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).TOOL_CHAIN_BUNDLE_READ)")
    fun toolchainBundle(@Argument id: String): ToolchainBundlePO? {
        return toolchainService.resolveToolchainBundle(id.toLong())
    }
}