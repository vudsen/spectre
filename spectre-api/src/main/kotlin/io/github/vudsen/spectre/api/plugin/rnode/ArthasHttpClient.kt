package io.github.vudsen.spectre.api.plugin.rnode

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.entity.ArthasSession
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException
import io.github.vudsen.spectre.api.exception.SessionNotFoundException

interface ArthasHttpClient {

    /**
     * 同步执行命令
     * @return 返回一个 JSON 对象，该对象为成功响应中的 `body.result` 数组字段
     */
    fun exec(command: String): Any

    /**
     * 异步执行任务
     * @param sessionId 会话 id
     * @param command 命令
     * @return 任务 id
     */
    fun execAsync(sessionId: String, command: String): Int

    /**
     * 同步执行 profiler 命令，对于这些命令，需要覆盖其中的 --file 参数
     * @param filename 文件名称，不包含后缀
     * @param commands 要执行的命令
     * @param sessionId 会话id，如果该值非空，表示异步执行，否则同步
     * @return 如果为同步执行，返回执行结果，如果为异步执行，返回空
     */
    fun execProfilerCommand(filename: String, commands: MutableList<String>, sessionId: String?): Any?

    /**
     * 列出 profiler 的结果
     * @return 文件名称
     */
    fun listProfilerFiles(): List<String>

    /**
     * 删除 profiler 文件
     */
    fun deleteProfilerFile(filename: String)

    /**
     * 读取 profiler 文件
     */
    fun readProfilerFile(filename: String): BoundedInputStreamSource?

    /**
     * 中断任务
     */
    fun interruptJob(sessionId: String)

    /**
     * 拉取命令执行结果
     * @return 返回一个 JSON 对象
     */
    @Throws(ConsumerNotFountException::class)
    fun pullResults(sessionId: String, consumerId: String): Any

    /**
     * 创建会话
     */
    fun initSession(): ArthasSession

    /**
     * 加入会话
     */
    @Throws(SessionNotFoundException::class)
    fun joinSession(sessionId: String): ArthasSession

    /**
     * 关闭会话
     */
    fun closeSession(sessionId: String)

    /**
     * 测试客户端是否正常
     */
    fun test()

    /**
     * 获取端口
     */
    fun getPort(): Int

    /**
     * arthas retransform.
     * @return 返回一个 JSON 对象
     */
    fun retransform(source: BoundedInputStreamSource): Any
}