package io.github.vudsen.spectre.api.entity

/**
 * Save all system configuration codes.
 */
enum class SysConfigCode(val code: String) {
    /**
     * 用于首页显示，系统的初始化进度
     */
    SPECTRE_INIT_STEP( "spectre.init.step")
}