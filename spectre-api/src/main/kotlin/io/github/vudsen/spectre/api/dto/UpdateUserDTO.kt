package io.github.vudsen.spectre.api.dto

class UpdateUserDTO {

    var id: Long = 0L

    var password: String? = null

    var displayName: String? = null

    var labels: Map<String, String>? = null

}