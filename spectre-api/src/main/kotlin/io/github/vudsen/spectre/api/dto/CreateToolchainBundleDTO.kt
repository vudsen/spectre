package io.github.vudsen.spectre.api.dto

import jakarta.validation.constraints.NotEmpty

class CreateToolchainBundleDTO {

    @field:NotEmpty
    var name: String = ""

    @field:NotEmpty
    var jattachTag: String = ""

    @field:NotEmpty
    var arthasTag: String = ""


}