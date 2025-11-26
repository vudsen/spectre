package io.github.vudsen.spectre.core.vo

import io.github.vudsen.spectre.api.entity.PageDescriptor

data class RuntimeNodePluginVO(
    var id: String,
    var name: String,
    /**
     * 插件描述，html 富文本
     */
    var description: String,
    var page: PageDescriptor,
)