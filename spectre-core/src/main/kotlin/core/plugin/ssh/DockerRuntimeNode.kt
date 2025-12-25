package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.common.plugin.rnode.AbstractShellRuntimeNode
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import org.springframework.util.StreamUtils
import java.io.File
import java.io.InputStream

class DockerRuntimeNode(
    private val delegate: SshRuntimeNode,
    private val dockerPath: String,
    private val containerId: String,
) : AbstractShellRuntimeNode() {

    var user: String? = null


    override fun execute(command: String): CommandExecuteResult {
        return if (user == null) {
            delegate.execute("$dockerPath exec $containerId $command")
        } else {
            delegate.execute("$dockerPath exec -u $user $containerId $command")
        }
    }

    override fun createInteractiveShell(command: String): InteractiveShell {
        return if (user == null) {
            delegate.createInteractiveShell("$dockerPath exec -it $containerId $command")
        } else {
            delegate.createInteractiveShell("$dockerPath exec -it -u $user $containerId $command")
        }
    }

    override fun ensureAttachEnvironmentReady() {
        delegate.ensureAttachEnvironmentReady()
    }

    override fun getConfiguration(): RuntimeNodeConfig {
        return delegate.getConfiguration()
    }

    override fun doUpload(input: InputStream, filename: String, dest: String) {
        createInteractiveShell("cat > $dest").use { shell ->
            input.use { inputStream ->
                val outputStream = shell.getOutputStream()
                inputStream.transferTo(outputStream)
            }
        }
    }

}