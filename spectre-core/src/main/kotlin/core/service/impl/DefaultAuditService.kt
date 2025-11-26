package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.LogEntityDTO
import io.github.vudsen.spectre.api.dto.LogEntityDTO.Companion.toDTO
import io.github.vudsen.spectre.repo.LogEntityRepository
import io.github.vudsen.spectre.api.service.AuditService
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultAuditService(
    private val logEntityRepository: LogEntityRepository,
    private val messageSource: MessageSource
) : AuditService {


    override fun listLogs(
        page: Int,
        size: Int
    ): Page<LogEntityDTO> {
        return logEntityRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))).map { po ->
            val dto = po.toDTO()
            dto.operation = messageSource.getMessage(dto.operation, null, LocaleContextHolder.getLocale())
            return@map dto
        }
    }

    override fun findById(id: Long): LogEntityDTO? {
        return logEntityRepository.findById(id).getOrNull()?.toDTO()
    }
}