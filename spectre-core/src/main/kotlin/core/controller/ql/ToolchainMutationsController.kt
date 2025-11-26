package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.api.service.ToolchainService
import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.core.vo.ToolchainBundleModifyVO
import io.github.vudsen.spectre.core.vo.ToolchainItemModifyVO
import io.github.vudsen.spectre.repo.po.ToolchainBundlePO
import io.github.vudsen.spectre.repo.po.ToolchainItemId
import io.github.vudsen.spectre.repo.po.ToolchainItemPO
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.MutationMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller
import org.springframework.validation.annotation.Validated

@Controller
@SchemaMapping(typeName = "ToolchainMutations")
class ToolchainMutationsController(
    private val toolchainService: ToolchainService
) {

    object ToolchainMutations

    @MutationMapping
    fun toolchain(): ToolchainMutations {
        return ToolchainMutations
    }

    @SchemaMapping
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).TOOL_CHAIN_UPDATE)")
    fun updateOrCreateToolchain(@Argument @Validated po: ToolchainItemModifyVO): ToolchainItemPO? {
        val r = toolchainService.updateOrCreateToolchainItem(
            ToolchainItemPO(ToolchainItemId(po.type, po.tag), po.url, po.armUrl)
        )
        return r
    }

    @SchemaMapping
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).TOOL_CHAIN_BUNDLE_CREATE)")
    fun createToolchainBundle(
        @Argument @Validated(CreateGroup::class) vo: ToolchainBundleModifyVO
    ): ToolchainBundlePO {
        return toolchainService.updateOrCreateToolchainBundle(ToolchainBundlePO(
            null,
            vo.name,
            null,
            vo.jattachTag,
            vo.arthasTag,
            vo.httpClientTag
        ))
    }
}