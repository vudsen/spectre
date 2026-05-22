package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.CreateArthasInstanceDTO
import io.github.vudsen.spectre.api.dto.UpdateArthasInstanceDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.api.service.ArthasInstanceService
import io.github.vudsen.spectre.common.Jvm
import io.github.vudsen.spectre.repo.ArthasInstanceRepository
import io.github.vudsen.spectre.repo.po.ArthasInstancePO
import jakarta.transaction.Transactional
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.WeakHashMap
import java.util.concurrent.ConcurrentHashMap
import kotlin.jvm.optionals.getOrNull

@Service
open class DefaultArthasInstanceService(
    private val arthasInstanceRepository: ArthasInstanceRepository,
) : ArthasInstanceService {
    private val logger = LoggerFactory.getLogger(DefaultArthasInstanceService::class.java)

    companion object {
        private const val MAX_IDLE_MILLISECONDS = 1000 * 60 * 5
    }

    private class ClientHolder(
        val wrapper: ArthasHttpClient,
        var lastAccess: Long,
    )

    @Scheduled(cron = "0 0 0/6 * * ?")
    @Transactional(rollbackOn = [Exception::class])
    fun clearStaleInstance() {
        logger.info("Start clean staled arthas instance")
        val accessBefore =
            arthasInstanceRepository.deleteAllByLastAccessBefore(
                Instant.ofEpochMilli(System.currentTimeMillis() - 1000 * 60 * 60 * 24), // 1 day
            )
        logger.info("Successfully remove {} instances", accessBefore)
    }

    @Scheduled(cron = "0 0/30 * * * ?")
    fun cleanerTask() {
        val current = System.currentTimeMillis()

        val iterator = clientMap.entries.iterator()
        while (iterator.hasNext()) {
            val nx = iterator.next()
            if (current - nx.value.lastAccess >= MAX_IDLE_MILLISECONDS) {
                iterator.remove()
            }
        }
    }

    private val clientMap = ConcurrentHashMap<String, ClientHolder>()

    private val updateInterval = 1000 * 60 * 10L

    /**
     * 保存上次更新数据库时间
     */
    private val lastUpdateMap = WeakHashMap<String, Long>()

    private fun buildId(
        runtimeNodeId: Long,
        jvm: Jvm,
    ): String = "$runtimeNodeId:${jvm.hashCode()}"

    override fun list(
        page: Int,
        size: Int,
    ): Page<ArthasInstancePO> = arthasInstanceRepository.findAll(PageRequest.of(page, size))

    @Transactional(rollbackOn = [Exception::class])
    override fun save(
        instance: CreateArthasInstanceDTO,
        client: ArthasHttpClient,
    ) {
        clientMap[instance.id] = ClientHolder(client, System.currentTimeMillis())

        arthasInstanceRepository.save(
            ArthasInstancePO(
                id = instance.id,
                channelId = instance.channelId,
                endpointPassword = instance.endpointPassword,
                boundPort = instance.boundPort,
                sessionId = instance.sessionId,
                runtimeNodeId = instance.runtimeNodeId,
                restrictedMode = instance.restrictedMode,
                bundleId = instance.bundleId,
                extPointId = instance.extPointId,
                jvm = instance.jvm,
                path = instance.path,
            ),
        )
    }

    @Transactional(rollbackOn = [Exception::class])
    override fun updateArthasInstance(update: UpdateArthasInstanceDTO) {
        val id = update.id
        val arthasInstance = arthasInstanceRepository.findById(id).getOrNull() ?: throw BusinessException("Arthas instance is not found")

        update.boundPort?.let {
            arthasInstance.boundPort = it
        }
        update.sessionId?.let {
            arthasInstance.sessionId = it
        }
    }

    override fun saveClient(
        tree: ArthasInstancePO,
        client: ArthasHttpClient,
    ) {
        clientMap[tree.id] = ClientHolder(client, System.currentTimeMillis())
    }

    override fun findInstanceById(id: String): ArthasInstancePO? {
        val instance = arthasInstanceRepository.findById(id).getOrNull() ?: return null
        val now = System.currentTimeMillis()
        lastUpdateMap[instance.id]?.let {
            if (now - it < updateInterval) {
                return instance
            }
        }
        instance.lastAccess = Instant.now()
        lastUpdateMap[instance.id] = now
        return instance
    }

    override fun findInstanceByChannelId(id: String): ArthasInstancePO? = arthasInstanceRepository.findById(id).getOrNull()

    override fun resolveCachedClientByChannelId(channelId: String): Pair<ArthasHttpClient?, ArthasInstancePO>? {
        val arthasInstanceDTO = findInstanceByChannelId(channelId) ?: return null
        return Pair(
            clientMap[arthasInstanceDTO.id]?.wrapper,
            arthasInstanceDTO,
        )
    }

    override fun resolveCachedClient(treeNodeId: String): Pair<ArthasHttpClient?, ArthasInstancePO>? {
        val arthasInstanceDTO = findInstanceById(treeNodeId) ?: return null
        return Pair(
            clientMap[arthasInstanceDTO.id]?.wrapper,
            arthasInstanceDTO,
        )
    }

    @Transactional
    override fun clearCachedClient(cleanAllInstance: Boolean) {
        clientMap.clear()
        if (cleanAllInstance) {
            arthasInstanceRepository.deleteAll()
        }
    }
}
