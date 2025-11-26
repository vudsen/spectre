package io.github.vudsen.spectre.core.plugin.k8s

class K8sExecContext(
    var namespace: String,
    var podName: String,
    var container: String
)