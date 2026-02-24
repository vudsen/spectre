package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.core.integrate.UserWithID
import io.github.vudsen.spectre.api.service.UserService
import io.github.vudsen.spectre.core.vo.LoginRequestVO
import io.github.vudsen.spectre.repo.po.UserPO
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.security.web.context.SecurityContextRepository
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController


@RequestMapping("auth")
@RestController
class AuthController(
    private val userService: UserService,
    private val authenticationManager: AuthenticationManager
) {


    /**
     * @return 用户id
     */
    @PostMapping("login")
    @Log("log.login", contextResolveExp = "{ username: #args[0].username }")
    fun login(@RequestBody @Validated vo: LoginRequestVO, request: HttpServletRequest, response: HttpServletResponse): UserPO {
        val authToken =
            UsernamePasswordAuthenticationToken(vo.username, vo.password)
        val authentication = authenticationManager.authenticate(authToken)

        val context = SecurityContextHolder.createEmptyContext()
        context.authentication = authentication

        val repo: SecurityContextRepository = HttpSessionSecurityContextRepository()
        repo.saveContext(context, request, response)

        SecurityContextHolder.setContext(context)
        val uid = (authentication.principal as UserWithID).id
        return userService.findById(uid)!!
    }


}