package io.github.vudsen.spectre.core.vo

import jakarta.validation.constraints.Size


class RoleBindUserRequestVO {

    @Size(min = 1)
    var roleIds: List<String> = emptyList()

    @Size(min = 1)
    var userIds: List<String> = emptyList()

}