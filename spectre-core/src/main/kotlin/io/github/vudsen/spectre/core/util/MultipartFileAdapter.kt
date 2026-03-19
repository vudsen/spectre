package io.github.vudsen.spectre.core.util

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import org.springframework.web.multipart.MultipartFile
import java.io.InputStream

class MultipartFileAdapter(
    private val delegate: MultipartFile,
) : BoundedInputStreamSource {
    override fun size(): Long = delegate.size

    override fun getInputStream(): InputStream = delegate.inputStream

    override fun close() {
        delegate.inputStream.close()
    }
}
