package io.github.vudsen.spectre.core.internal

import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.core.bean.ArthasClientWrapper
import io.github.vudsen.spectre.core.bean.ArthasClientInitStatus
import jakarta.annotation.PostConstruct
import org.springframework.scheduling.TaskScheduler
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.Duration
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock

/**
 * 缓存 arthas 客户端，提供定时删除功能以防止内存泄露
 */
@Service
class ArthasClientCacheService {

    companion object {
        const val MAX_IDLE_MILLISECONDS = 1000 * 60 * 5
    }

    private class ClientHolder(
        val wrapper: ArthasClientWrapper,
        var lastAccess: Long
    )

    @Scheduled(cron = "0 0/5 * * * ?")
    fun cleanerTask() {
        val current = System.currentTimeMillis()

        val iterator = clientMap.entries.iterator()
        while (iterator.hasNext()) {
            val nx = iterator.next()
            if (current - nx.value.lastAccess >= MAX_IDLE_MILLISECONDS) {
                iterator.remove()
            }
        }
        val iterator1 = initMap.entries.iterator()
        while (iterator1.hasNext()) {
            val nx = iterator1.next()
            if (current - nx.value.lastAccess >= MAX_IDLE_MILLISECONDS) {
                iterator1.remove()
            }
        }
    }


    /**
     * - key: see [resolveJvmId]
     */
    private val clientMap = ConcurrentHashMap<String, ClientHolder>()

    /**
     * - key: see [resolveJvmId]
     */
    private val initMap = HashMap<String, ArthasClientInitStatus>()

    private val modifyLock = ReentrantLock()

    fun resolveJvmId(runtimeNodeId: Long, jvm: Jvm): String {
        return "${runtimeNodeId}:${jvm.hashCode()}"
    }

    fun resolveCachedClient(runtimeNodeId: Long, jvm: Jvm): ArthasClientWrapper? {
        return resolveCachedClient(resolveJvmId(runtimeNodeId, jvm))
    }

    fun resolveCachedClient(jvmId: String): ArthasClientWrapper? {
        val clientHolder = clientMap[jvmId] ?: return null
        clientHolder.lastAccess = System.currentTimeMillis()
        return clientHolder.wrapper
    }

    fun saveClient(jvmId: String, wrapper: ArthasClientWrapper) {
        clientMap[jvmId] = ClientHolder(wrapper, System.currentTimeMillis())
        initMap.remove(jvmId)
    }

    fun startInit(jvmId: String): ArthasClientInitStatus? {
        initMap[jvmId]?.let {
            it.lastAccess = System.currentTimeMillis()
            return it;
        }
        if (!modifyLock.tryLock()) {
            return null
        }
        try {
            initMap[jvmId]?.let {
                it.lastAccess = System.currentTimeMillis()
                return it;
            }
            val arthasClientInitStatus = ArthasClientInitStatus(UUID.randomUUID().toString(), System.currentTimeMillis())
            initMap[jvmId] = arthasClientInitStatus
            return arthasClientInitStatus
        } finally {
            modifyLock.unlock()
        }
    }

}