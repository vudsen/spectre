package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.plugin.rnode.Jvm

class DockerJvm(id: String, name: String, val pid: Int = 1) : Jvm(id, name) {

    constructor() : this("", "")

}