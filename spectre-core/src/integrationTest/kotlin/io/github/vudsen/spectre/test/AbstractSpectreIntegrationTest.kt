package io.github.vudsen.spectre.test

import io.github.vudsen.spectre.SpectreApplication
import io.github.vudsen.spectre.common.ApplicationContextHolder
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.graphql.test.autoconfigure.tester.AutoConfigureHttpGraphQlTester
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient
import org.springframework.context.ApplicationContext
import org.springframework.graphql.test.tester.HttpGraphQlTester
import org.springframework.test.web.reactive.server.WebTestClient
import org.springframework.util.MultiValueMap
import tools.jackson.databind.json.JsonMapper
import java.util.function.Consumer

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@AutoConfigureWebTestClient
@AutoConfigureHttpGraphQlTester
@SpringBootTest(classes = [SpectreApplication::class], webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
abstract class AbstractSpectreIntegrationTest {
    protected val jsonMapper = JsonMapper.builderWithJackson2Defaults().build()

    @Autowired
    lateinit var graphQlTester: HttpGraphQlTester

    @Autowired
    lateinit var client: WebTestClient

//    @Autowired
//    fun setClientForDebug(client: WebTestClient) {
//        this.client = client.mutate().responseTimeout(Duration.ofDays(1)).build()
//    }

    var cookiesConsumer: Consumer<MultiValueMap<String, String>> = {}

    @BeforeEach
    fun beforeAll(
        @Autowired applicationContext: ApplicationContext,
    ) {
        ApplicationContextHolder.applicationContext = applicationContext
    }

    @AfterEach
    fun afterEach() {
        GlobalDisposer.destroy()
    }

    protected fun setupCookies(
        username: String,
        password: String,
    ) {
        val responseCookies =
            client
                .post()
                .uri("spectre-api/auth/login")
                .bodyValue(
                    mutableMapOf(
                        "username" to username,
                        "password" to password,
                    ),
                ).exchange()
                .expectStatus()
                .isOk
                .returnResult()
                .responseCookies

        val valueMap = MultiValueMap.fromSingleValue<String, String>(mutableMapOf())
        for (entry in responseCookies) {
            for (cookie in entry.value) {
                valueMap.add(entry.key, cookie.value)
            }
        }
        cookiesConsumer = { cookies -> cookies.addAll(valueMap) }
    }
}
