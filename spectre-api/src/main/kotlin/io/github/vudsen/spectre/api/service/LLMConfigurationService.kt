package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.LLMConfigurationDTO

interface LLMConfigurationService {

    fun getCurrent(): LLMConfigurationDTO?

    fun saveOrUpdate(configuration: LLMConfigurationDTO): LLMConfigurationDTO

}
