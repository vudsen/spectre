package io.github.vudsen.spectre.support

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import java.io.InputStream

class InteractiveShellInputStreamSource(
    private val shell: InteractiveShell,
    private val size: Long,
) : BoundedInputStreamSource {
    override fun size(): Long = size

    override fun getInputStream(): InputStream = shell.getInputStream()

    override fun close() {
        shell.close()
    }
}
