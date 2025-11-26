package io.github.vudsen.spectre.api.dto

import java.io.Serializable

class ChannelSessionDTO(
    val consumerId: String,
    val name: String
) : Serializable {

    companion object {
        const val serialVersionUID = 14651561458L
    }

    constructor() : this("", "")
}