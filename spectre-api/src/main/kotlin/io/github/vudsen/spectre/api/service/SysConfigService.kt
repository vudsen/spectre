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
     * 带乐观锁的更新
     *
     * 注意，不支持更新加密值
     */
    fun updateConfigByIdWithOptimisticCheck(id: Long, oldValue: String, value: String): Int

    /**
     * 更新教程当前进行的步骤
     */
    fun updateTourStep(step: Int)

}