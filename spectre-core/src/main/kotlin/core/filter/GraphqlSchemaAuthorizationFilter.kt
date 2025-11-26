package io.github.vudsen.spectre.core.filter

import io.github.vudsen.spectre.core.integrate.GraphQLAuthenticationToken
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletRequest
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.AnonymousAuthenticationToken
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.context.SecurityContextHolderStrategy
import org.springframework.web.filter.OncePerRequestFilter

class GraphqlSchemaAuthorizationFilter(
    private val authenticationManager: AuthenticationManager,
    private val graphQLEndpoint: String,
) : OncePerRequestFilter() {

    private var securityContextHolderStrategy: SecurityContextHolderStrategy = SecurityContextHolder
        .getContextHolderStrategy()

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        doAuthorization(request)
        filterChain.doFilter(request, response)
    }

    private fun doAuthorization(
        request: ServletRequest,
    ) {
        request as HttpServletRequest
        if (request.requestURI != graphQLEndpoint) {
            return
        }
        val token = request.getHeader(HttpHeaders.AUTHORIZATION)
        if (token == null) {
            return
        }
        val authResult = authenticationManager.authenticate(GraphQLAuthenticationToken(token))
        val context = securityContextHolderStrategy.createEmptyContext()
        context.authentication = authResult
        securityContextHolderStrategy.context = context
    }
}