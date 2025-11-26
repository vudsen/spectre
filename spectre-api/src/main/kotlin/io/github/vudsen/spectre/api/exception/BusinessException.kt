package io.github.vudsen.spectre.api.exception

open class BusinessException(
    val messageKey: String,
    val messageArgs: Array<Any?> = emptyArray(),
    val code: String? = null
) : RuntimeException(messageKey)