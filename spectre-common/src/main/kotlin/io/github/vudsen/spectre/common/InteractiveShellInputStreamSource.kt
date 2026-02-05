package io.github.vudsen.spectre.common

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import java.io.InputStream

class InteractiveShellInputStreamSource(private val shell: InteractiveShell, private val size: Long) : BoundedInputStreamSource {
    override fun size(): Long {
        return size
    }

    override fun getInputStream(): InputStream {
        return shell.getInputStream()
    }

    override fun close() {
        shell.close()
    }
}