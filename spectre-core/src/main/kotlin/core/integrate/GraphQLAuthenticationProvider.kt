package io.github.vudsen.spectre.core.integrate

import io.github.vudsen.spectre.common.SpectreEnvironment
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.DisabledException
import org.springframework.security.core.Authentication
import org.springframework.security.core.AuthenticationException
import org.springframework.security.crypto.password.PasswordEncoder

class GraphQLAuthenticationProvider(
    private val passwordEncoder: PasswordEncoder
) : AuthenticationProvider {


    override fun authenticate(authentication: Authentication): Authentication? {
        val token = SpectreEnvironment.GRAPHQL_AUTHORIZATION_TOKEN
        if (token == null) {
            throw DisabledException("GRAPHQL_AUTHORIZATION_TOKEN is null")
        }
        authentication as GraphQLAuthenticationToken
        authentication.isAuthenticated = passwordEncoder.matches(authentication.credentials, token)
        return authentication
    }


    override fun supports(authentication: Class<*>?): Boolean {
        return authentication == GraphQLAuthenticationToken::class.java
    }
}