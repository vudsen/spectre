package io.github.vudsen.spectre.api.plugin.rnode.pool

import io.github.vudsen.spectre.api.plugin.rnode.CloseableRuntimeNode

fun interface RuntimeNodeFactory {

    fun createInstance(): CloseableRuntimeNode

}