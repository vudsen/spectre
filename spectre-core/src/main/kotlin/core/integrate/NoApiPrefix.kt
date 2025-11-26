package io.github.vudsen.spectre.core.integrate

/**
 * 使用到API接口上，表示这个接口不需要添加 `spectre-api` 前缀
 */
@Target(AnnotationTarget.FUNCTION)
annotation class NoApiPrefix()
