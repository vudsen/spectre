package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size

class ModifyUserPasswordVO {

    @NotEmpty
    var userId: String = ""

    @NotEmpty
    @Size(min = 8, max = 32)
    var newPassword: String = ""

}