package io.github.vudsen.spectre.common.plugin.rnode

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import java.io.File
import java.io.InputStream
import kotlin.text.iterator

abstract class AbstractShellRuntimeNode(private val extensionPoint: RuntimeNodeExtensionPoint) : ShellAvailableRuntimeNode{


    override fun isFileExist(path: String): Boolean {
        return execute("test -f $path").exitCode == 0
    }

    override fun isArm(): Boolean {
        val result = execute("uname -a").ok()
        return result.contains("arm", ignoreCase = true) ||
                result.contains("aarch64", ignoreCase = true) ||
                result.contains("arm64", ignoreCase = true)
    }

    override fun upload(src: String, dest: String) {
        val file = File(src)
        if (file.length() == 0L) {
            return
        }
        file.inputStream().use { inputStream ->
            upload(inputStream, file.name, dest)
        }
    }

    override fun upload(input: InputStream, filename: String, dest: String) {
        if (input.available() == 0) {
            return
        }
        if (isFileExist(dest)) {
            return
        }
        val tmp = "$dest.tmp"
        doUpload(input, filename, tmp)
        execute("mv $tmp $dest").ok()
    }


    /**
     * 上传文件. 子类不需要任何检查
     */
    protected abstract fun doUpload(input: InputStream, filename: String, dest: String)

    override fun unzipTarGzPkg(target: String, dest: String) {
        TODO("Not yet implemented")
    }

    override fun mkdirs(path: String) {
        execute("mkdir -p $path").let {
            if (it.exitCode != 0 && it.stdout.contains("Permission denied")) {
                throw BusinessException("error.permission.denied", arrayOf(path))
            }
        }
    }

    override fun isDirectoryExist(path: String): Boolean {
        return execute("test -d $path").exitCode == 0
    }

    override fun listFiles(directory: String): List<String> {
        execute("ls $directory").tryUnwrap() ?.let {
            val result = mutableListOf<String>()
            val buf = StringBuilder()
            for (ch in it) {
                if (ch == ' ' || ch == '\n') {
                    if (buf.isEmpty()) {
                        continue
                    }
                    result.add(buf.toString())
                    buf.clear()
                } else {
                    buf.append(ch)
                }
            }
            if (buf.isNotEmpty()) {
                result.add(buf.toString())
            }
            return result
        }
        return emptyList()
    }

    override fun getExtPoint(): RuntimeNodeExtensionPoint {
        return extensionPoint
    }
}