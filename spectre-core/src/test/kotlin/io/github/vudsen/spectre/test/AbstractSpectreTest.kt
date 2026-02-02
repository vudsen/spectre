package io.github.vudsen.spectre.test

import io.github.vudsen.spectre.SpectreApplication
import io.github.vudsen.spectre.common.SpectreEnvironment
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
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
        @DynamicPropertySource
        @JvmStatic
        fun sysProperties(registry: DynamicPropertyRegistry) {
            registry.add("spectre.home") { SpectreEnvironment.SPECTRE_HOME }
            System.setProperty("spectre.home", SpectreEnvironment.SPECTRE_HOME)
        }
    }

    fun setupSecurityContext(username: String, password: String) {
        val authToken =
            UsernamePasswordAuthenticationToken(username, password)
        val authentication = authenticationManager.authenticate(authToken)

        val context = SecurityContextHolder.createEmptyContext()
        context.authentication = authentication
        SecurityContextHolder.setContext(context)
    }

    @BeforeEach
    fun _setupSecurityContext() {
        setupSecurityContext(TestConstant.ROOT_USER_USERNAME, TestConstant.ROOT_USER_PASSWORD)
    }

    @AfterEach
    fun _cleanSecurityContext() {
        SecurityContextHolder.clearContext()
        GlobalDisposer.destroy()
    }


}