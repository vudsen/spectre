package io.github.vudsen.spectre.test

import org.springframework.boot.webtestclient.autoconfigure.WebTestClientBuilderCustomizer
import org.springframework.http.HttpHeaders
import org.springframework.test.web.reactive.server.WebTestClient

class MyWebTestClientCustomizer : WebTestClientBuilderCustomizer {
    override fun customize(builder: WebTestClient.Builder) {
        builder.baseUrl("/spectre-api/")
            .defaultHeader(HttpHeaders.USER_AGENT, "Spectre Integration Test")
    }
}