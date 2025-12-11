package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class RoleBindVO {
    @NotEmpty
    var userId: String = ""

    @NotEmpty
    var roleId: String = ""

}