package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.NotEmpty

class RoleBindUserRequestVO {

    @NotEmpty
    var roleId: String = ""

    var userIds: List<String> = emptyList()

}