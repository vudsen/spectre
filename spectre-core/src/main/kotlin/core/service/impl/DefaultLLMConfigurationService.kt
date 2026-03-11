package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO
import io.github.vudsen.spectre.api.service.LLMConfigurationService
import io.github.vudsen.spectre.repo.LLMConfigurationRepository
import io.github.vudsen.spectre.repo.po.LLMConfigurationPO
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultLLMConfigurationService(
    private val llmConfigurationRepository: LLMConfigurationRepository,
) : LLMConfigurationService {

    override fun getCurrent(): LLMConfigurationDTO? {
        return llmConfigurationRepository.findFirstByEnabledTrueOrderByLastUpdateDesc()?.toDTO()
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun saveOrUpdate(configuration: LLMConfigurationDTO): LLMConfigurationDTO {
        val po = configuration.id
            ?.let { llmConfigurationRepository.findById(it).getOrNull() }
            ?: LLMConfigurationPO()

        po.provider = configuration.provider.trim().ifBlank { "OPENAI" }
        po.model = configuration.model.trim()
        po.baseUrl = configuration.baseUrl?.trim()?.ifBlank { null }
        po.apiKey = configuration.apiKey?.trim()?.ifBlank { null }
        po.enabled = configuration.enabled

        val saved = llmConfigurationRepository.save(po)

        if (saved.enabled) {
            llmConfigurationRepository.disableOtherConfigurations(saved.id!!)
        }

        return llmConfigurationRepository.findById(saved.id!!).getOrNull()!!.toDTO()
    }

    private fun LLMConfigurationPO.toDTO(): LLMConfigurationDTO {
        return LLMConfigurationDTO(
            id = id,
            provider = provider,
            model = model,
            baseUrl = baseUrl,
            apiKey = apiKey,
            enabled = enabled,
            createdAt = createdAt,
            lastUpdate = lastUpdate,
        )
    }
}
