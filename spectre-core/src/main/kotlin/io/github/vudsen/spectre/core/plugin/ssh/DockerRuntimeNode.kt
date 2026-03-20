package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import io.github.vudsen.spectre.common.RuntimeNodeConfig
import io.github.vudsen.spectre.support.plugin.rnode.AbstractShellRuntimeNode

class DockerRuntimeNode(
    private val delegate: SshRuntimeNode,
    private val dockerPath: String,
    private val containerId: String,
    private val homePath: String,
) : AbstractShellRuntimeNode() {
    var user: String? = null

    override fun execute(command: String): CommandExecuteResult =
        if (user == null) {
            delegate.execute("$dockerPath exec $containerId $command")
        } else {
            delegate.execute("$dockerPath exec -u $user $containerId $command")
        }

    /**
     * 创建交互性命令行
     * @param command 命令，不能带单引号!
     */
    override fun createInteractiveShell(command: String): InteractiveShell {
        val us =
            if (user == null) {
                ""
            } else {
                "-u $user"
            }
        return delegate.createInteractiveShell("$dockerPath exec -i $us $containerId sh -c '$command'")
    }

    override fun getHomePath(): String = homePath

    override fun ensureAttachEnvironmentReady() {
        delegate.ensureAttachEnvironmentReady()
    }

    override fun getConfiguration(): RuntimeNodeConfig = delegate.getConfiguration()

    override fun doUpload(
        source: BoundedInputStreamSource,
        dest: String,
    ) {
        createInteractiveShell("cat > $dest").use { shell ->
            source.inputStream.use { inputStream ->
                shell.getOutputStream().use { outputStream ->
                    inputStream.transferTo(outputStream)
                }
                shell.exitCode()?.let {
                    if (it != 0) {
                        throw BusinessException(String(shell.getInputStream().readAllBytes()))
                    }
                }
            }
        }
    }
}
