package io.github.vudsen.spectre.api.dto

class UpdateArthasInstanceDTO(
    val id: String,
) {
    var boundPort: Int? = null

    var sessionId: String? = null
}
