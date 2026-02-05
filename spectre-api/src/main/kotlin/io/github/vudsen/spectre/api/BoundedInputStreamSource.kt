package io.github.vudsen.spectre.api

import org.springframework.core.io.InputStreamSource
import java.io.Closeable

interface BoundedInputStreamSource : InputStreamSource, Closeable {

    /**
     * 获取流的大小
     */
    fun size(): Long

}