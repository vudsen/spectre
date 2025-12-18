package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.ArthasChannelDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException

/**
 * Arthas 执行服务
 *
 * 在每个 jvm 被 attach 后，都会分配一个随机并且唯一的 **channelId**
 */
interface ArthasExecutionService {

    /**
     * 尝试 attach 到指定 jvm
     * @param runtimeNodeId 节点id
     * @param ctx 由 JVM 树携带的节点上下文
     */
    fun requireAttach(runtimeNodeId: Long, treeNodeId: String, bundleId: Long): AttachStatus

    /**
     * 加入一个频道
     * @param channelId 频道id
     * @param ownerIdentifier 会话凭据。对于每个凭据，在并发调用时应该只能创建一个 session
     * @return consumer id. 该 id 应该被缓存到用户的会话中
     */
    fun joinChannel(channelId: String, ownerIdentifier: String): ArthasConsumerDTO

    /**
     * 异步执行命令
     */
    fun execAsync(channelId: String, command: String)

    /**
     * 拉取 arthas 执行结果
     * @return arthas http 接口结果，JSON对象
     */
    @Throws(ConsumerNotFountException::class)
    fun pullResults(channelId: String, consumerId: String): Any

    /**
     * 获取 channel 信息
     */
    fun getChannelInfo(channelId: String): ArthasChannelDTO?

    /**
     * 中断前台任务
     */
    fun interruptCommand(channelId: String)

}