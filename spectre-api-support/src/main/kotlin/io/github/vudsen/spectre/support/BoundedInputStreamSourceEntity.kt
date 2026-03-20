package io.github.vudsen.spectre.support

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import java.io.InputStream

class BoundedInputStreamSourceEntity(
    private val size: Long,
    private val inputStream: InputStream,
) : BoundedInputStreamSource {
    override fun size(): Long = size

    override fun getInputStream(): InputStream = inputStream

    override fun close() = inputStream.close()
}
