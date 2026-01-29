package io.github.vudsen.spectre.common

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import java.io.InputStream

class BoundedInputStreamSourceEntity(private val size: Long, private val inputStream: InputStream) : BoundedInputStreamSource {
    override fun size(): Long {
        return size
    }

    override fun getInputStream(): InputStream {
        return inputStream
    }
}