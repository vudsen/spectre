package io.github.vudsen.spectre.core.integrate

import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority

/**
 * 客户端请求 `/graphql` 获取 schema 时使用。
 */
class GraphQLAuthenticationToken(private val token: String) : AbstractAuthenticationToken(mutableListOf(SimpleGrantedAuthority(GRAPHQL_ROLE))) {

    companion object {
        const val GRAPHQL_ROLE = "ROLE_GRAPHQL_API"
    }

    override fun getCredentials(): String {
        return token
    }

    override fun getPrincipal() {}

}