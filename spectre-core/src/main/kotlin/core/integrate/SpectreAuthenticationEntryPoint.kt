package io.github.vudsen.spectre.core.integrate

import io.github.vudsen.spectre.core.vo.ErrorResponseVO
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.json.JsonMapper

class SpectreAuthenticationEntryPoint : AuthenticationEntryPoint {

    val objectMapper: ObjectMapper = JsonMapper.builderWithJackson2Defaults().build()

    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {
        response.contentType = MediaType.APPLICATION_JSON_VALUE;
        if (authException is BadCredentialsException) {
            response.status = HttpServletResponse.SC_BAD_REQUEST

            val resp = objectMapper.writeValueAsString(ErrorResponseVO(authException.message))
            response.writer.write(resp)
            return
        }
        response.status = HttpServletResponse.SC_UNAUTHORIZED

        val resp = objectMapper.writeValueAsString(ErrorResponseVO("请先登录"))
        response.writer.write(resp)
    }
}