package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.api.plugin.SecretEncryptor
import io.github.vudsen.spectre.common.EmptySecretEncryptor
import io.github.vudsen.spectre.common.SecureRandomFactory
import io.github.vudsen.spectre.common.SpectreEnvironment
import io.github.vudsen.spectre.core.filter.GraphqlSchemaAuthorizationFilter
import io.github.vudsen.spectre.core.integrate.AesGcmSecretEncryptor
import io.github.vudsen.spectre.core.integrate.GraphQLAuthenticationProvider
import io.github.vudsen.spectre.core.integrate.SpectreAuthenticationEntryPoint
import io.github.vudsen.spectre.core.integrate.SpectrePermissionEvaluator
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter


@Configuration
@EnableMethodSecurity
@EnableWebSecurity
class SecurityConfiguration {

    private val logger = LoggerFactory.getLogger(SecurityConfiguration::class.java)

    @Bean
    @ConditionalOnMissingBean
    fun secretEncryptor(): SecretEncryptor {
        val key = SpectreEnvironment.ENCRYPTOR_KEY
        val salt = SpectreEnvironment.ENCRYPTOR_SALT
        if (key != null) {
            val defaultSalt = "dU05W2pVNj9wUjUlakY1YA=="
            return AesGcmSecretEncryptor(key, salt ?: defaultSalt)
        }
        logger.warn("No secret encryptor configured, please add environment variable `ENCRYPTOR_KEY` and `ENCRYPTOR_SALT`(optional) to enable this.")
        return EmptySecretEncryptor()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }

    @Bean
    fun expressionHandler(evaluator: SpectrePermissionEvaluator): MethodSecurityExpressionHandler {
        val handler = DefaultMethodSecurityExpressionHandler()
        handler.setPermissionEvaluator(evaluator)
        return handler
    }

    @Bean
    fun filterChain(http: HttpSecurity, @Value("\${spring.graphql.http.path:'/graphql'}") graphqlEndpoint: String): SecurityFilterChain {
        http
            .authorizeHttpRequests { authorize ->
                authorize
                    .requestMatchers("/spectre-api/auth/**").permitAll()
                    .requestMatchers("/spectre-api/error").permitAll()
                    .requestMatchers("/spectre/**").permitAll()
                    .requestMatchers("/").permitAll()
                    .anyRequest().authenticated()

            }
            .csrf { csrf -> csrf.disable() }
            .exceptionHandling { e ->
                e.authenticationEntryPoint(SpectreAuthenticationEntryPoint())
            }
            .addFilterAfter(
                GraphqlSchemaAuthorizationFilter(authenticationManager(http), graphqlEndpoint),
                AnonymousAuthenticationFilter::class.java
            )
            .logout { logoutConfigurer ->
                logoutConfigurer
                    .clearAuthentication(true)
                    .logoutUrl("/spectre-api/logout")
                    .logoutSuccessHandler { _, response, _ ->
                        response.status = HttpStatus.OK.value()
                    }
            }

        return http.build()
    }

    @Bean
    @Throws(Exception::class)
    fun authenticationManager(http: HttpSecurity): AuthenticationManager {
        return http.getSharedObject(AuthenticationManagerBuilder::class.java)
            .authenticationProvider(GraphQLAuthenticationProvider(passwordEncoder()))
            .build()
    }

}