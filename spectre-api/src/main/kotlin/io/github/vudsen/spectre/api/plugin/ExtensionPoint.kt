package io.github.vudsen.spectre.api.plugin

/**
 * 系统扩展点.
 * TODO: rename to plugin.
 */
interface ExtensionPoint {

    /**
     * 获取唯一id
     */
    fun getId(): String

    /**
     * 获取扩展点名称
     */
    fun getExtensionPointName(): String


}