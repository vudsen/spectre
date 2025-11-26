package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.common.plugin.rnode.AbstractShellRuntimeNode
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import java.io.File

class DockerRuntimeNode(
    private val delegate: SshRuntimeNode,
    private val dockerPath: String,
    private val containerId: String
) : AbstractShellRuntimeNode() {

    var user: String? = null

    override fun doUpload(src: File, dest: String) {
        TODO("Not yet implemented")
    }

    override fun execute(command: String): CommandExecuteResult {
        return if (user == null) {
            delegate.execute("$dockerPath exec $containerId $command")
        } else {
            delegate.execute("$dockerPath exec -u $user $containerId $command")
        }
    }

    override fun createInteractiveShell(command: String): InteractiveShell {
        TODO("Not yet implemented")
    }

    override fun test() {
        delegate.test()
    }

    override fun getConfiguration(): RuntimeNodeConfig {
        return delegate.getConfiguration()
    }
}