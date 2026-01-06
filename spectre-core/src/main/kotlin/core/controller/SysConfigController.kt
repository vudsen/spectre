package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.service.SysConfigService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("sys-conf")
class SysConfigController(
    private val sysConfigService: SysConfigService
) {

    @PostMapping("tour")
    fun updateTourStep(@RequestParam step: String) {
        sysConfigService.updateTourStep(step.toInt())
    }


    @GetMapping("{id}")
    fun resolveValue(@PathVariable id: Long): String {
        return sysConfigService.findConfigValue(id)
    }


}