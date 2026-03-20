package io.github.vudsen.spectre.core.bean

import org.springframework.data.domain.Page

class PageResult<T>(
    val totalPages: Int,
    val result: List<T>,
)

fun <T : Any> Page<T>.toPageResult(): PageResult<T> = PageResult(totalPages, toList())

fun <T> emptyResult(): PageResult<T> = PageResult(0, emptyList())
