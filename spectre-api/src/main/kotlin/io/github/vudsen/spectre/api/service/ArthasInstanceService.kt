package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.CreateArthasInstanceDTO
import io.github.vudsen.spectre.api.dto.UpdateArthasInstanceDTO
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.repo.po.ArthasInstancePO

/**
 * 缓存 arthas 客户端，避免重复创建
 */
interface ArthasInstanceService {
    /**
     * 保存实例. 如果存在，则会报错
     */
    fun save(
        instance: CreateArthasInstanceDTO,
        client: ArthasHttpClient,
    )

    /**
     * 更新端口和客户端
     */
    fun updateArthasInstance(update: UpdateArthasInstanceDTO)

    /**
     * 保存客户端
     */
    fun saveClient(
        tree: ArthasInstancePO,
        client: ArthasHttpClient,
    )

    /**
     * 查询或者创建 ArthasInstance
     *
     * @return ArthasInstance，如果是新创建的 [ArthasInstancePO.boundPort] 为 0
     */
    fun findInstanceById(id: String): ArthasInstancePO?

    fun findInstanceByChannelId(id: String): ArthasInstancePO?

    fun resolveCachedClientByChannelId(channelId: String): Pair<ArthasHttpClient?, ArthasInstancePO>?

    /**
     * 获取缓存中的客户端
     */
    fun resolveCachedClient(treeNodeId: String): Pair<ArthasHttpClient?, ArthasInstancePO>?

    /**
     * 测试使用，清除所有客户端缓存
     */
    fun clearCachedClient(cleanAllInstance: Boolean)
}
