package io.github.vudsen.spectre.api.exception

import io.github.vudsen.spectre.common.ApplicationContextHolder
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import java.util.Locale
import kotlin.Any
import kotlin.Array

open class BusinessException(
    val messageKey: String,
    val messageArgs: Array<out Any?> = emptyArray(),
) : RuntimeException(messageKey) {
    var httpStatus: Int? = null

    fun toI18nMessage(locale: Locale? = null): String =
        ApplicationContextHolder.applicationContext.getBean(MessageSource::class.java).getMessage(
            messageKey,
            messageArgs as Array<Any>?,
            locale ?: LocaleContextHolder.getLocale(),
        )
}
