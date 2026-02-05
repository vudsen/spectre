package io.github.vudsen.spectre.common

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.common.progress.ProgressReportHolder
import io.github.vudsen.spectre.common.progress.checkCanceled
import io.github.vudsen.spectre.repo.entity.ToolchainType
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream
import org.slf4j.LoggerFactory
import org.springframework.core.io.InputStreamSource
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.zip.GZIPOutputStream
import java.util.zip.ZipFile

object LocalPackageManager {

    private val logger = LoggerFactory.getLogger(LocalPackageManager::class.java)

    private fun resolvePackageName(type: ToolchainType, tag: String, isArm: Boolean): String {
        return if (isArm) {
            "${type.originalName}-arm-${tag}.${type.bundleExtensionName}"
        } else {
            "${type.originalName}-${tag}.${type.bundleExtensionName}"
        }
    }

    private fun resolvePackagePath(
        type: ToolchainType,
        tag: String,
        isArm: Boolean
    ): String =
        "${SpectreEnvironment.SPECTRE_HOME}/downloads/${resolvePackageName(type, tag, isArm)}"


    fun isCached(type: ToolchainType, tag: String, isArm: Boolean): Boolean {
        val destPath = resolvePackagePath(type, tag, isArm)
        return File(destPath).exists()
    }

    fun savePackage(type: ToolchainType, tag: String, isArm: Boolean, source: InputStreamSource) {
        source.inputStream.use { inputStream ->
            FileOutputStream(File(resolvePackagePath(type, tag, isArm))).use { fileOutputStream ->
                inputStream.transferTo(fileOutputStream)
            }
        }
    }

    private class ConstantBoundedInputStreamSource(private val data: ByteArray) : BoundedInputStreamSource {
        override fun size(): Long {
            return data.size.toLong()
        }

        override fun getInputStream(): InputStream {
            return ByteArrayInputStream(data)
        }

        override fun close() {}

    }

    private val httpClient: ConstantBoundedInputStreamSource

    init {
        LocalPackageManager::class.java.classLoader.getResourceAsStream("http-client.jar")!!.use { inputStream ->
            val bytes = inputStream.readAllBytes()
            httpClient = ConstantBoundedInputStreamSource(bytes)
        }
    }

    fun resolveBundledHttpClient(): BoundedInputStreamSource {
        return httpClient
    }

    /**
     * 获取对应软件包的路径.
     *
     * **如果软件包是 `zip`，则会被解压后重新打包成 `tar.gz`**；对于其它类型的文件不会做任何处理.
     * @param url 文件路径
     * @return 软件包路径
     */
    fun resolvePackage(type: ToolchainType, tag: String, isArm: Boolean, url: String): File {
        val destPath = resolvePackagePath(type, tag, isArm)
        val destFile = File(destPath)
        if (destFile.exists()) {
            if (destFile.extension == "zip") {
                val tgz = File("${destFile.parentFile.absolutePath}/${destFile.nameWithoutExtension}.tar.gz")
                if (tgz.exists()) {
                    return tgz
                }
                return repackageToGzip(destFile)
            }
            return destFile
        }
        if (!destFile.parentFile.mkdirs()) {
            logger.warn("Failed to create directory for file: $destPath")
        }

        val tempFile = File(destFile.parentFile.absolutePath + "/" + destFile.name + ".tmp")

        val baseText = "下载 ${type.originalName} 到服务器"
        val progress = ProgressReportHolder.currentProgressManager()
        progress?.pushState(baseText)

        try {
            tempFile.outputStream().use { output ->
                val connection = URL(url).openConnection() as HttpURLConnection
                try {
                    if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                        throw IllegalStateException(
                            "Unexpected HTTP status ${connection.responseCode}, body: ${
                                String(
                                    connection.inputStream.readAllBytes(),
                                    StandardCharsets.UTF_8
                                )
                            }"
                        )
                    }
                    val total = connection.contentLength
                    val totalMb = String.format("%.2f", total * 1.0 / 1024 / 1024)

                    connection.inputStream.use { input ->
                        val buffer = ByteArray(connection.contentLength.coerceAtMost(1024 * 1024 * 10))
                        var bytesRead: Int
                        var totalBytesRead = 0
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            totalBytesRead += bytesRead
                            checkCanceled()
                            progress?.let {
                                it.currentProgress()?.title = "$baseText (${
                                    String.format(
                                        "%.2fMB",
                                        totalBytesRead * 1.0 / 1024 / 1024
                                    )
                                } / ${totalMb}MB)"
                            }
                        }
                    }
                } finally {
                    connection.disconnect()
                }
            }
            tempFile.renameTo(destFile)
        } finally {
            progress?.popState()
        }
        if (destFile.extension == "zip") {
            return repackageToGzip(destFile)
        }
        return destFile
    }

    private fun repackageToGzip(file: File): File {
        // 解压 zip 文件到临时目录
        val tempDir = File(file.parent, file.nameWithoutExtension + "_tmp")
        tempDir.mkdirs()
        val tarGzFile: File
        try {
            ZipFile(file).use { zip ->
                zip.entries().asSequence().forEach { entry ->
                    val outFile = File(tempDir, entry.name)
                    if (entry.isDirectory) {
                        outFile.mkdirs()
                    } else {
                        outFile.parentFile.mkdirs()
                        zip.getInputStream(entry).use { input ->
                            outFile.outputStream().use { output ->
                                input.copyTo(output)
                            }
                        }
                    }
                }
            }
            // 打包为 tar.gz
            tarGzFile = File("${file.parentFile.absolutePath}/${file.nameWithoutExtension}.tar.gz")
            FileOutputStream(tarGzFile).use { fos ->
                GZIPOutputStream(fos).use { gos ->
                    TarArchiveOutputStream(gos).use { tarOut ->
                        tempDir.walkTopDown().filter { it.isFile }.forEach { fileInDir ->
                            val entryName = fileInDir.relativeTo(tempDir).path.replace("\\", "/")
                            val tarEntry = tarOut.createArchiveEntry(fileInDir, entryName)
                            tarOut.putArchiveEntry(tarEntry)
                            fileInDir.inputStream().use { input -> input.copyTo(tarOut) }
                            tarOut.closeArchiveEntry()
                        }
                    }
                }
            }
        } finally {
            // 清理临时目录
            tempDir.deleteRecursively()
        }
        return tarGzFile
    }

}

