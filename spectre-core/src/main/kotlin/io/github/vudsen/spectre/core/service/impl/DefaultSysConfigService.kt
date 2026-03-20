package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.SecretEncryptorManager
import io.github.vudsen.spectre.api.entity.SysConfigIds
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.SysConfigService
import io.github.vudsen.spectre.repo.SysConfigRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultSysConfigService(
    private val sysConfigRepository: SysConfigRepository,
    private val secretEncryptorManager: SecretEncryptorManager,
) : SysConfigService {
    override fun findConfigValue(id: Long): String? {
        val conf = sysConfigRepository.findById(id).getOrNull() ?: throw BusinessException("配置不存在")
        val value = conf.value ?: return null

        SysConfigIds.encryptedIds[id]?.let {
            return secretEncryptorManager.decrypt(value, it)
        }
        return value
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun updateConfig(
        id: Long,
        value: String,
    ) {
        val salt = SysConfigIds.encryptedIds[id]
        val actualValue: String =
            if (salt == null) {
                value
            } else {
                secretEncryptorManager.encrypt(value, salt)
            }

        sysConfigRepository.updateValueById(id, actualValue)
    }

    override fun updateConfigByIdWithOptimisticCheck(
        id: Long,
        oldValue: String,
        value: String,
    ): Int = sysConfigRepository.updateValueByIdWithOptimisticCheck(id, oldValue, value)

    @Transactional(rollbackFor = [Exception::class])
    override fun updateTourStep(step: Int) {
        val totalStep = 3
        val currentStep = findConfigValue(SysConfigIds.SPECTRE_TOUR_STEP)!!.toInt()
        if (step == currentStep) {
            if (step >= totalStep) {
                return
            } else {
                updateConfig(SysConfigIds.SPECTRE_TOUR_STEP, (step + 1).toString())
            }
        }
    }
}
