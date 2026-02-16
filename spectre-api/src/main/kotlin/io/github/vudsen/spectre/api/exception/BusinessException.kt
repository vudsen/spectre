package io.github.vudsen.spectre.api.exception

open class BusinessException(
    val messageKey: String,
    val messageArgs: Array<out Any?> = emptyArray(),
) : RuntimeException(messageKey) {

    var httpStatus: Int? = null
}