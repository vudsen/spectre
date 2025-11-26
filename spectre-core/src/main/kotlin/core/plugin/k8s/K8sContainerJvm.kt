package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.api.plugin.rnode.Jvm

class K8sContainerJvm(
    id: String,
    name: String,
    var namespace: String?,
    /**
     * 容器名称，支持多容器.
     */
    var containerName: String
) : Jvm(id, name) {
    constructor() : this("", "", null, "")
}
