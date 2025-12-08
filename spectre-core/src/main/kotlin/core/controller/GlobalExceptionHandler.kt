package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.core.vo.ErrorResponseVO
import io.github.vudsen.spectre.core.vo.ValidationErrorResponseVO
import org.slf4j.LoggerFactory
import org.springframework.context.MessageSource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.servlet.NoHandlerFoundException
import java.lang.reflect.InvocationTargetException

@ControllerAdvice
class GlobalExceptionHandler(
    private val messageSource: MessageSource
) {

    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

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

    @ResponseBody
    @ExceptionHandler(Exception::class)
    fun bizExceptionHandler(e: Exception): ResponseEntity<ErrorResponseVO> {
        val ex = if (e is InvocationTargetException) {
            e.targetException
        } else {
            e
        }
        if (ex is BusinessException) {
            return ResponseEntity
                .status(ex.httpStatus ?: 200)
                .body(ErrorResponseVO(
                    messageSource.getMessage(ex.messageKey, ex.messageArgs, null))
                )
        } else if (ex is BadCredentialsException) {
            return ResponseEntity.ok(ErrorResponseVO(ex.message))
        }
        logger.error("", ex)
        return ResponseEntity.ok(
            ErrorResponseVO(
                messageSource.getMessage("error.server.internal.error", emptyArray(), null)
            )
        )
    }
}