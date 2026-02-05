package io.github.vudsen.spectre.api.entity

class ProfilerFile(val timestamp: Long, val channelId: String, val extension: String) {

    constructor() : this(0, "", "")

}