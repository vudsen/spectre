package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.api.service.ArthasInstanceService
import io.github.vudsen.spectre.core.bean.PageResult
import io.github.vudsen.spectre.core.bean.toPageResult
import io.github.vudsen.spectre.repo.po.ArthasInstancePO
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller

@Controller
@SchemaMapping(typeName = "ArthasInstanceQueries")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_READ)")
class ArthasInstanceQueriesController(
    private val arthasInstanceService: ArthasInstanceService,
) {
    object ArthasInstanceQueries

    @QueryMapping
    fun arthasInstance(): ArthasInstanceQueries = ArthasInstanceQueries

    @SchemaMapping
    fun list(
        @Argument page: Int,
        @Argument size: Int,
    ): PageResult<ArthasInstancePO> = arthasInstanceService.list(page, size).toPageResult()
}
