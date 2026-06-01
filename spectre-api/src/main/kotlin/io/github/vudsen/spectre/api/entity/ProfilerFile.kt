package io.github.vudsen.spectre.api.entity

class ProfilerFile(
    val timestamp: Long,
    val instanceId: String,
    val extension: String,
) {
    constructor() : this(0, "", "")
}
