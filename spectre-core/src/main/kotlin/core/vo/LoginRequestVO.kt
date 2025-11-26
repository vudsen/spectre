package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class LoginRequestVO {

    @NotEmpty
    var username: String? = null

    @NotEmpty
    var password: String? = null
}