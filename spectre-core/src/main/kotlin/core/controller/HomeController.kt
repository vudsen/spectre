package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.core.integrate.NoApiPrefix
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class HomeController {

    @GetMapping("/")
    @NoApiPrefix
    fun home(response: HttpServletResponse) {
        response.sendRedirect("/spectre")
        response.status = HttpStatus.PERMANENT_REDIRECT.value()
    }

}