package io.github.vudsen.spectre.test

import io.github.vudsen.spectre.SpectreApplication
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource


/**
 * 提供一些基础环境的初始化.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@SpringBootTest(classes = [SpectreApplication::class], webEnvironment = SpringBootTest.WebEnvironment.NONE)
abstract class AbstractSpectreTest {

    @set:Autowired
    lateinit var authenticationManager: AuthenticationManager

    companion object {
        var redis = TestContainerUtils.createRedis()
        @DynamicPropertySource
        @JvmStatic
        fun redisProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.data.redis.host", redis::getHost)
            registry.add("spring.data.redis.port") { redis.getMappedPort(6379) }
            registry.add("spring.data.redis.password") { TestContainerUtils.REDIS_PASSWORD }
        }
    }

    @BeforeEach
    fun setupSecurityContext() {
        val authToken =
            UsernamePasswordAuthenticationToken(TestConstant.ROOT_USER_USERNAME, TestConstant.ROOT_USER_PASSWORD)
        val authentication = authenticationManager.authenticate(authToken)

        val context = SecurityContextHolder.createEmptyContext()
        context.authentication = authentication
        SecurityContextHolder.setContext(context)
    }

    @AfterEach
    fun cleanSecurityContext() {
        SecurityContextHolder.clearContext()
    }


}