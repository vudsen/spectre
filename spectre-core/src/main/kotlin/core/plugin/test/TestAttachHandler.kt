package io.github.vudsen.spectre.core.plugin.test

import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.api.plugin.rnode.JvmAttachHandler

class TestAttachHandler : JvmAttachHandler {
    override fun attach(port: Int?): ArthasHttpClient {
        return FakeArthasHttpClient()
    }
}