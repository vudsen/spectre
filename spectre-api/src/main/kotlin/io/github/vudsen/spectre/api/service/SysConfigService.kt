package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.entity.SysConfigCode

interface SysConfigService {

    /**
     * 查询配置的值
     */
    fun findConfigValue(id: Long): String

    /**
     * 更新配置
     */
    fun updateConfig(id: Long, value: String)

}