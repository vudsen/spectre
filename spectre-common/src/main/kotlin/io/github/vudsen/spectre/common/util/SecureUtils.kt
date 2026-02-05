package io.github.vudsen.spectre.common.util

import java.nio.file.Paths

object SecureUtils {

    fun isPathInjection(fileName: String, baseDir: String): Boolean {
        return try {
            // 1. 定义基准路径并规范化（不依赖文件是否存在）
            val base = Paths.get(baseDir).toAbsolutePath().normalize()

            // 2. 将用户输入的文件名拼接到基准路径上
            // resolve 会处理文件名中的 ../
            // normalize 会消除掉路径中的冗余，例如 /a/b/../c 变为 /a/c
            val target = base.resolve(fileName).toAbsolutePath().normalize()

            // 3. 核心安全检查：规范化后的目标路径必须依然以基准路径为前缀
            // 这样即使 fileName 是 "../../../etc/passwd"，normalize 之后它也不再以 base 开头
            !target.startsWith(base)
        } catch (_: Exception) {
            // 发生任何解析异常（非法路径字符等）均视为注入攻击
            true
        }
    }


    /**
     * 是否为单纯的文件名，没有保护路径等信息
     */
    fun isNotPureFilename(fileName: String): Boolean  {
        return fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")
    }
}