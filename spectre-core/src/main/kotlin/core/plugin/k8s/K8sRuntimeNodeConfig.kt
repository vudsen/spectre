package io.github.vudsen.spectre.core.plugin.k8s

import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig

data class K8sRuntimeNodeConfig(
    var apiServerEndpoint: String,
    var token: String,
    var spectreHome: String = "/opt/spectre",
    var insecure: Boolean = false
) : RuntimeNodeConfig {

    constructor() : this("", "", "/opt/spectre", false)

}