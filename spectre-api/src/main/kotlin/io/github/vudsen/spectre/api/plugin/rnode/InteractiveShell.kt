package io.github.vudsen.spectre.api.plugin.rnode

import java.io.InputStream
import java.io.OutputStream
import java.io.Writer

interface InteractiveShell : AutoCloseable {

    fun getInputStream(): InputStream

    /**
     * 获取 writer。用于发送文本数据.
     *
     * **该方法和 [getOutputStream] 只能同时调用一个，不能混用**
     */
    fun getWriter(): Writer

    /**
     * 获取输出流。主要用于发送二进制数据。
     *
     * **该方法和 [getWriter] 只能同时调用一个，不能混用**
     */
    fun getOutputStream(): OutputStream

    fun isAlive(): Boolean

    /**
     * 退出码，如果还没有退出，返回空
     */
    fun exitCode(): Int?


}