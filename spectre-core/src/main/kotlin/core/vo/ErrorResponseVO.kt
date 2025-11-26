package io.github.vudsen.spectre.core.vo

class ErrorResponseVO(
    val message: String?,
    val code: String? = null
) {
    val error = true
}