package io.github.vudsen.spectre.core.bean

import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient

class ArthasClientWrapper(
    val client: ArthasHttpClient,
    val channelId: String
)