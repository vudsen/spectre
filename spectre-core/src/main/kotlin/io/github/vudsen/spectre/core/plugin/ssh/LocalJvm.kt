package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.common.Jvm

class LocalJvm(
    id: String,
    name: String,
) : Jvm(id, name) {
    constructor() : this("", "")
}
