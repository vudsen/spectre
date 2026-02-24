package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.core.bean.PageResult
import io.github.vudsen.spectre.core.bean.toPageResult
import io.github.vudsen.spectre.api.service.ToolchainService
import io.github.vudsen.spectre.api.vo.ToolchainItemResponseVO
import io.github.vudsen.spectre.repo.entity.ToolchainType
import io.github.vudsen.spectre.repo.po.ToolchainBundlePO
import io.github.vudsen.spectre.repo.po.ToolchainItemPO
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller

@Controller
@SchemaMapping(typeName = "ToolchainItemQueries")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).TOOL_CHAIN_READ)")
class ToolchainQueriesController(
    private val toolchainService: ToolchainService
) {

    object ToolchainItemQueries

    @QueryMapping
    fun toolchain(): ToolchainItemQueries {
        return ToolchainItemQueries
    }

    @SchemaMapping(typeName = "ToolchainItemQueries", field = "toolchainItems")
    fun toolchainItems(@Argument type: String, @Argument page: Int, @Argument size: Int): PageResult<ToolchainItemPO> {
        return toolchainService.listToolchainItems(ToolchainType.valueOf(type), page, size).toPageResult()
    }

    @SchemaMapping(typeName = "ToolchainItemQueries", field = "toolchainBundles")
    fun toolchainBundles(@Argument page: Int, @Argument size: Int): PageResult<ToolchainBundlePO> {
        return toolchainService.listToolchainBundles(page, size).toPageResult()
    }

    @SchemaMapping(typeName = "ToolchainItemQueries", field = "toolchainBundle")
    fun toolchainBundle(@Argument id: String): ToolchainBundleDTO? {
        return toolchainService.resolveToolchainBundle(id.toLong())
    }

    @SchemaMapping(typeName = "ToolchainItemQueries", field = "toolchainItemsV2")
    fun toolchainItemsV2(
        @Argument type: String,
        @Argument page: Int,
        @Argument size: Int
    ): PageResult<ToolchainItemResponseVO> {
        val result = toolchainService.listToolchainItems(ToolchainType.valueOf(type), page, size)
        return PageResult(result.totalPages, result.mapIndexed { _, item ->
            val id = item.id
            val type = id.type
            val tag = id.tag
            return@mapIndexed ToolchainItemResponseVO(
                type,
                tag,
                item.url,
                item.armUrl,
                item.createdAt,
                toolchainService.isPackageCached(type, tag, false),
                toolchainService.isPackageCached(type, tag, true)
            )
        })

    }

}