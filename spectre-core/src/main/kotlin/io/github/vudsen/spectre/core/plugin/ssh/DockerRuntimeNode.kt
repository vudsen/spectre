package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import io.github.vudsen.spectre.common.RuntimeNodeConfig
import io.github.vudsen.spectre.support.plugin.rnode.AbstractShellRuntimeNode

class DockerRuntimeNode(
    private val hostNode: SshRuntimeNode,
    private val dockerPath: String,
    private val containerId: String,
    private val homePath: String,
) : AbstractShellRuntimeNode() {
    var user: String? = null

    override fun execute(command: String): CommandExecuteResult =
        if (user == null) {
            hostNode.execute("$dockerPath exec $containerId $command")
        } else {
            hostNode.execute("$dockerPath exec -u $user $containerId $command")
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
        return hostNode.createInteractiveShell("$dockerPath exec -i $us $containerId sh -c '$command'")
    }

    override fun getHomePath(): String = homePath

    override fun ensureAttachEnvironmentReady() {
        hostNode.ensureAttachEnvironmentReady()
    }

    override fun getConfiguration(): RuntimeNodeConfig = hostNode.getConfiguration()

    override fun doUpload(
        source: BoundedInputStreamSource,
        dest: String,
    ) {
        val homePath = hostNode.getHomePath()
        val filename = dest.subSequence(dest.lastIndexOf('/') + 1, dest.length)

        val hostPath = "$homePath/$filename"
        hostNode.upload(source, hostPath)
        hostNode.execute(dockerPath, "cp", hostPath, "$containerId:$dest").ok()
        hostNode.deleteFile(hostPath)
    }
}
