package io.github.vudsen.spectre.core.vo

class ValidationErrorResponseVO(
    val errors: List<ValidationErrorInfo>
) {
    val validationError = true

    class ValidationErrorInfo(
        val fieldName: String?,
        val message: String,
    )

}