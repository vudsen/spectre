package io.github.vudsen.spectre.api.dto


class UpdateRuntimeNodeDTO {

    var id: Long = 0

    var name: String? = null

    var labels: Map<String, String>? = null

    var configuration: String? = null

    var restrictedMode: Boolean? = null


}