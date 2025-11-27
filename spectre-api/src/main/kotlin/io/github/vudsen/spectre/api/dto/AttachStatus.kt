package io.github.vudsen.spectre.api.dto

import com.fasterxml.jackson.annotation.JsonProperty

class AttachStatus(
    @field:JsonProperty("isReady")
    var isReady: Boolean,
) {

    /**
     * 每个 arthas 进程在全局唯一的 id
     */
    var channelId: String? = null
    var error: ErrorInfo? = null
    var title: String? = null
    var message: String? = null

    class ErrorInfo(
        var message: String,
        var nextRetryTime: Long
    )
}