package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.LogEntityDTO
import org.springframework.data.domain.Page

interface AuditService {

    /**
     * 列出所有日志
     */
    fun listLogs(page: Int, size: Int): Page<LogEntityDTO>

    /**
     * 根据id查询日志
     */
    fun findById(id: Long): LogEntityDTO?

}