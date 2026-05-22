package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.BoundedInputStreamSource
import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.entity.ProfilerFile
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException
import tools.jackson.databind.JsonNode

/**
 * Arthas 执行服务
 *
 * 在每个 jvm 被 attach 后，都会分配一个随机并且唯一的 **channelId**
 */
interface ArthasExecutionService {
    /**
     * 尝试 attach 到指定 jvm
     * @param runtimeNodeId 节点id
     */
    fun requireAttach(
        runtimeNodeId: Long,
        treeNodeId: String,
        bundleId: Long,
    ): AttachStatus

    /**
     * 加入一个频道
     * @param instanceId 频道id
     * @param ownerIdentifier 会话凭据。对于每个凭据，在并发调用时应该只能创建一个 session
     * @return consumer id. 该 id 应该被缓存到用户的会话中
     */
    fun joinChannel(
        instanceId: String,
        ownerIdentifier: String,
    ): ArthasConsumerDTO

    /**
     * 异步执行命令
     */
    fun execAsync(
        instanceId: String,
        command: String,
    )

    /**
     * 同步执行命令
     */
    fun execSync(
        instanceId: String,
        command: String,
    ): JsonNode

    /**
     * 拉取 arthas 执行结果
     * @return arthas http 接口结果，JSON对象
     */
    @Throws(ConsumerNotFountException::class)
    fun pullResults(
        instanceId: String,
        consumerId: String,
    ): JsonNode

    /**
     * 中断前台任务
     */
    fun interruptCommand(instanceId: String)

    /**
     * 替换字节码. 该命令为同步命令
     */
    fun retransform(
        instanceId: String,
        source: BoundedInputStreamSource,
    ): JsonNode

    /**
     * 列出 profiler 文件
     */
    fun listProfilerFiles(instanceId: String): List<ProfilerFile>

    /**
     * 读取 profiler 文件
     */
    fun readProfilerFile(file: ProfilerFile): BoundedInputStreamSource?
}
