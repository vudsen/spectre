package io.github.vudsen.spectre.core.bean

import org.springframework.data.domain.Page

class PageResult <T>(
    val totalPages: Int,
    val result: List<T>
)
fun <T : Any> Page<T>.toPageResult(): PageResult<T> {
    return PageResult(totalPages, toList())
}

fun <T> emptyResult(): PageResult<T> {
    return PageResult(0, emptyList())
}