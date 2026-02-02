package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.ArthasInstanceDTO
import io.github.vudsen.spectre.api.dto.ArthasInstanceDTO.Companion.toDTO
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.service.ArthasInstanceService
import io.github.vudsen.spectre.repo.ArthasInstanceRepository
import jakarta.transaction.Transactional
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.WeakHashMap
import java.util.concurrent.ConcurrentHashMap
import kotlin.jvm.optionals.getOrNull

@Service
open class DefaultArthasInstanceService(
    private val arthasInstanceRepository: ArthasInstanceRepository
) : ArthasInstanceService {

    private val logger = LoggerFactory.getLogger(DefaultArthasInstanceService::class.java)

    companion object {
        private const val MAX_IDLE_MILLISECONDS = 1000 * 60 * 5
    }

    private class ClientHolder(
        val wrapper: ArthasHttpClient,
        var lastAccess: Long
    )

    @Scheduled(cron = "0 0 3 * * ?")
    fun clearStaleInstance() {
        logger.info("Start clean staled arthas instance")
        val accessBefore = arthasInstanceRepository.deleteAllByLastAccessBefore(
            Instant.ofEpochMilli(System.currentTimeMillis() - 1000 * 60 * 60 * 2),
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


    private fun updateLastAccess(instance: ArthasInstanceDTO) {
        val now = System.currentTimeMillis()
        lastUpdateMap[instance.id]?.let {
            if (now - it < updateInterval) {
                return
            }
        }

        val instancePO = instance.toPO()

        instancePO.lastAccess = Instant.now()
        lastUpdateMap[instance.id] = now
        arthasInstanceRepository.save(instancePO)
    }

    private fun buildId(runtimeNodeId: Long, jvm: Jvm): String {
        return "${runtimeNodeId}:${jvm.hashCode()}"
    }


    @Transactional(rollbackOn = [Exception::class])
    override fun save(
        instance: ArthasInstanceDTO,
        client: ArthasHttpClient
    ) {
        val id = buildId(instance.runtimeNodeId, instance.jvm)
        clientMap[id] = ClientHolder(client, System.currentTimeMillis())

        arthasInstanceRepository.save(instance.toPO())
    }

    @Transactional(rollbackOn = [Exception::class])
    override fun updateBoundPortAndClient(
        base: ArthasInstanceDTO,
        newPort: Int,
        client: ArthasHttpClient
    ) {
        val id = buildId(base.runtimeNodeId, base.jvm)
        clientMap[id] = ClientHolder(client, System.currentTimeMillis())

        val po = base.toPO()
        po.boundPort = newPort

        arthasInstanceRepository.save(po)
    }

    override fun saveClient(
        instance: ArthasInstanceDTO,
        client: ArthasHttpClient
    ) {
        clientMap[buildId(instance.runtimeNodeId, instance.jvm)] = ClientHolder(client, System.currentTimeMillis())
    }


    override fun findInstanceById(id: String): ArthasInstanceDTO? {
        arthasInstanceRepository.findById(id).getOrNull()?.toDTO() ?.let {
            updateLastAccess(it)
            return it
        }
        return null
    }

    override fun findInstanceByChannelId(id: String): ArthasInstanceDTO? {
        return arthasInstanceRepository.findByChannelId(id)?.toDTO()
    }

    override fun resolveCachedClientByChannelId(channelId: String): Pair<ArthasHttpClient?, ArthasInstanceDTO>? {
        val arthasInstanceDTO = findInstanceByChannelId(channelId) ?: return null
        return Pair(
            clientMap[buildId(arthasInstanceDTO.runtimeNodeId, arthasInstanceDTO.jvm)]?.wrapper,
            arthasInstanceDTO
        )
    }

    override fun resolveCachedClient(
        treeNodeId: String
    ): Pair<ArthasHttpClient?, ArthasInstanceDTO>? {
        val arthasInstanceDTO = findInstanceById(treeNodeId) ?: return null
        return Pair(
            clientMap[buildId(arthasInstanceDTO.runtimeNodeId, arthasInstanceDTO.jvm)]?.wrapper,
            arthasInstanceDTO
        )
    }

    override fun clearCachedClient() {
        clientMap.clear()
    }


}