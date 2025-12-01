package io.github.vudsen.spectre.common.plugin.rnode

import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNode

/**
 * 表示当前节点可以上传文件
 */
interface ShellAvailableRuntimeNode : RuntimeNode {

    /**
     * 执行命令
     */
    fun execute(command: String): CommandExecuteResult

    /**
     * 执行命令
     */
    fun execute(vararg commands: String): CommandExecuteResult {
        return execute(commands.joinToString(" "))
    }


    /**
     * 创建交互式命令
     */
    fun createInteractiveShell(command: String): InteractiveShell

    /**
     * 列出指定目录下所有文件
     */
    fun listFiles(directory: String): List<String>

    /**
     * 文件夹是否存在
     */
    fun isDirectoryExist(path: String): Boolean

    /**
     * 递归创建文件夹
     *
     * 当碰到权限不足时，会抛出异常
     */
    fun mkdirs(path: String)

    /**
     * 解压 tar.gz 包
     */
    fun unzipTarGzPkg(target: String, dest: String)

    /**
     * 将本地的文件发送到宿主机上面
     * @param src 本地文件路径
     * @param dest 目标路径，指定文件的绝对路径。 **需要确保父目录存在**
     */
    fun upload(src: String, dest: String)

    /**
     * 是否为 arm 架构
     */
    fun isArm(): Boolean

    /**
     * 文件是否存在
     */
    fun isFileExist(path: String): Boolean


}