package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.ArthasInstanceDTO
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.repo.po.ArthasInstancePO

/**
 * 缓存 arthas 客户端，避免重复创建
 */
interface ArthasInstanceService {

    /**
     * 保存实例. 如果存在，则会报错
     */
    fun save(instance: ArthasInstanceDTO, client: ArthasHttpClient)

    /**
     * 更新端口和客户端
     */
    fun updateArthasInstance(update: ArthasInstancePO)

    /**
     * 保存客户端
     */
    fun saveClient(tree: ArthasInstanceDTO, client: ArthasHttpClient)

    /**
     * 查询或者创建 ArthasInstance
     *
     * @return ArthasInstance，如果是新创建的 [ArthasInstanceDTO.boundPort] 为 0
     */
    fun findInstanceById(id: String): ArthasInstanceDTO?

    fun findInstanceByChannelId(id: String): ArthasInstanceDTO?

    fun resolveCachedClientByChannelId(channelId: String): Pair<ArthasHttpClient?, ArthasInstanceDTO>?

    /**
     * 获取缓存中的客户端
     */
    fun resolveCachedClient(treeNodeId: String): Pair<ArthasHttpClient?, ArthasInstanceDTO>?

    /**
     * 测试使用，清除所有客户端缓存
     */
    fun clearCachedClient()

}