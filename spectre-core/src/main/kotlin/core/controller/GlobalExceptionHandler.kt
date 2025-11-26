package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.core.vo.ErrorResponseVO
import io.github.vudsen.spectre.core.vo.ValidationErrorResponseVO
import org.springframework.context.MessageSource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.servlet.NoHandlerFoundException

@ControllerAdvice
class GlobalExceptionHandler(
    private val messageSource: MessageSource
) {


    @ResponseBody
    @ExceptionHandler(BusinessException::class)
    fun bizExceptionHandler(e: BusinessException): ResponseEntity<ErrorResponseVO> {
        return ResponseEntity.ok(
            ErrorResponseVO(
                messageSource.getMessage(e.messageKey, e.messageArgs, null),
                e.code
            )
        )
    }

    @ResponseBody
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun validationExceptionHandler(e: MethodArgumentNotValidException): ResponseEntity<ValidationErrorResponseVO> {
        val errors = buildList {
            for (error in e.bindingResult.allErrors) {
                if (error is FieldError) {
                    add(ValidationErrorResponseVO.ValidationErrorInfo(error.field, error.defaultMessage ?: "<Unknown>"))
                } else {
                    add(ValidationErrorResponseVO.ValidationErrorInfo(null, error?.defaultMessage ?: "<Unknown>"))
                }
            }
        }
        return ResponseEntity.ok(ValidationErrorResponseVO(errors))
    }

    @ResponseBody
    @ExceptionHandler(NoHandlerFoundException::class)
    fun notFoundException(e: NoHandlerFoundException): ResponseEntity<ErrorResponseVO> {
        if (e.requestURL == "/") {
            return ResponseEntity.status(HttpStatus.PERMANENT_REDIRECT).header(HttpHeaders.LOCATION, "/spectre").build()
        }
        return ResponseEntity.status(HttpStatus.PERMANENT_REDIRECT).header(HttpHeaders.LOCATION, "/spectre/notfound")
            .build()
    }
}