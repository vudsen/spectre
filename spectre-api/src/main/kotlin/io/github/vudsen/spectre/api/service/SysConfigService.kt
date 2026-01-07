package io.github.vudsen.spectre.api.service

interface SysConfigService {

    /**
     * 查询配置的值
     */
    fun findConfigValue(id: Long): String

    /**
     * 更新配置
     */
    fun updateConfig(id: Long, value: String)

    /**
     * 更新教程当前进行的步骤
     */
    fun updateTourStep(step: Int)

}