package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.plugin.rnode.Jvm

class LocalJvm(id: String, name: String) : Jvm(id, name) {
    constructor() : this("", "")
}