package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.entity.SysConfigCode
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.SysConfigService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("sys-conf")
class SysConfigController(
    private val sysConfigService: SysConfigService
) {

    @GetMapping("{id}")
    fun resolveValue(@PathVariable id: Long): String {
        return sysConfigService.findConfigValue(id)
    }

    private fun toEnum(code: String): SysConfigCode {
        val codeEnum = try {
            SysConfigCode.valueOf(code)
        } catch (_: Exception) {
            throw BusinessException("配置不存在")
        }
        return codeEnum
    }

    @PostMapping("{id}/update")
    fun updateConfig(@PathVariable id: Long, @RequestBody value: String) {
        return sysConfigService.updateConfig(id, value)
    }

}