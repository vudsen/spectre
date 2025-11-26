package io.github.vudsen.spectre.core.audit

import org.intellij.lang.annotations.Language

/**
 * 日志注解
 */
@Target(AnnotationTarget.FUNCTION)
annotation class Log(
    val messageKey: String,
    /**
     * 一个 SpEL 表达式，返回 Map 或 空，用于保存上下文
     * @see [LogAspect]
     */
    @Language("SpEL")
    val contextResolveExp: String = "null"
)
