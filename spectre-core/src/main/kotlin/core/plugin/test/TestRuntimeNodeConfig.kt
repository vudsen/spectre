package io.github.vudsen.spectre.core.plugin.test

import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig

class TestRuntimeNodeConfig : RuntimeNodeConfig{

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        return true
    }

    override fun hashCode(): Int {
        return javaClass.hashCode()
    }
}