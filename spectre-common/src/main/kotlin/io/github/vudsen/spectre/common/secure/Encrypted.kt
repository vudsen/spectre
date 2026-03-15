package io.github.vudsen.spectre.common.secure

/**
 * 添加到字段上，表示该值需要被加密存储。
 */
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
annotation class Encrypted
