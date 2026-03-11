package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.LLMConfigurationPO
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface LLMConfigurationRepository : JpaRepository<LLMConfigurationPO, Long> {

    fun findFirstByEnabledTrueOrderByLastUpdateDesc(): LLMConfigurationPO?

    @Modifying
    @Query("update LLMConfigurationPO p set p.enabled = false where p.id <> :excludeId")
    fun disableOtherConfigurations(@Param("excludeId") excludeId: Long)

    @Modifying
    @Query("update LLMConfigurationPO p set p.enabled = false")
    fun disableAllConfigurations()
}
