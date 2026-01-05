package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.SysConfigService
import io.github.vudsen.spectre.repo.SysConfigRepository
import io.github.vudsen.spectre.repo.po.SysConfigPO
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultSysConfigService(
    private val sysConfigRepository: SysConfigRepository,
) : SysConfigService {

    override fun findConfigValue(id: Long): String {
        return sysConfigRepository.findById(id).getOrNull()?.value ?: throw BusinessException("配置不存在")
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun updateConfig(id: Long, value: String) {
        val po = SysConfigPO().apply {
            this.id = id
            this.value = value
        }
        sysConfigRepository.save(po)
    }

}