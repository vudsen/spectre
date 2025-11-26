package io.github.vudsen.spectre.core.controller.ql

import io.github.vudsen.spectre.api.dto.LogEntityDTO
import io.github.vudsen.spectre.api.service.AuditService
import io.github.vudsen.spectre.core.bean.PageResult
import io.github.vudsen.spectre.core.bean.toPageResult
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.graphql.data.method.annotation.SchemaMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Controller


@Controller
@SchemaMapping(typeName = "LogEntityQueries")
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).AUDIT_READ)")
class LogEntityQueriesController(
    private val auditService: AuditService
) {

    object LogQueries

    @QueryMapping(name = "log")
    fun logBase(): LogQueries {
        return LogQueries
    }

    @SchemaMapping
    fun logs(@Argument page: Int, @Argument size: Int): PageResult<LogEntityDTO> {
        return auditService.listLogs(page, size).toPageResult()
    }

    @SchemaMapping
    fun log(@Argument id: Long): LogEntityDTO? {
        return auditService.findById(id)
    }

}