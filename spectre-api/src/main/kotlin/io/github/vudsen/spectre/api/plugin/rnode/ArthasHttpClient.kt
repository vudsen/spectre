package io.github.vudsen.spectre.api.plugin.rnode

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.entity.ArthasSession
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException
import io.github.vudsen.spectre.api.exception.SessionNotFoundException
import org.springframework.boot.web.server.PortInUseException
import org.springframework.core.io.InputStreamSource

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
    fun asyncExec(sessionId: String, command: String): Int

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
    @Throws(PortInUseException::class)
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