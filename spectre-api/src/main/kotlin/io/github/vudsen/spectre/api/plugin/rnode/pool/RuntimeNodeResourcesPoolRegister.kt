package io.github.vudsen.spectre.api.plugin.rnode.pool

import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock

object RuntimeNodeResourcesPoolRegister {

    private class ResourcesPoolHolder(
        val pool: ResourcesPool,
        var lastUsed: Long,
    )

    private val executor: ScheduledExecutorService = Executors.newSingleThreadScheduledExecutor()

    private val poolMap = HashMap<RuntimeNodeConfig, ResourcesPoolHolder>()

    private val lock = ReentrantLock()

    init {
        executor.scheduleAtFixedRate({
            for (entry in poolMap.entries) {
                if (System.currentTimeMillis() - entry.value.lastUsed > 1000 * 60 * 10) {
                    poolMap.remove(entry.key)
                }
            }
        }, 2, 2, TimeUnit.MINUTES)
    }

    fun getPool(config: RuntimeNodeConfig, factory: RuntimeNodeFactory): ResourcesPool {
        val pool = poolMap[config]
        if (pool != null) {
            pool.lastUsed = System.currentTimeMillis()
            return pool.pool
        }
        lock.lock()
        return try {
            val p = ResourcesPool(factory)
            poolMap[config] = ResourcesPoolHolder(p, System.currentTimeMillis())
            p
        } finally {
            lock.unlock()
        }
    }

    /**
     * 提示注册器对应的资源池还在使用
     */
    fun reportInUsing(config: RuntimeNodeConfig) {
        poolMap[config]?.lastUsed = System.currentTimeMillis()
    }


}