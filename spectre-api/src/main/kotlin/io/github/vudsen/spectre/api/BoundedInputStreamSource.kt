package io.github.vudsen.spectre.api

import org.springframework.core.io.InputStreamSource

interface BoundedInputStreamSource : InputStreamSource{

    /**
     * 获取流的大小
     */
    fun size(): Long

}