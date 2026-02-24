package io.github.vudsen.spectre.api.dto

import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size

class CreateUserDTO {

    @NotEmpty
    var username: String = ""

    @NotEmpty
    @Size(min = 8)
    var password: String = ""

    var displayName: String? = null

    var labels: Map<String, String> = emptyMap()

}