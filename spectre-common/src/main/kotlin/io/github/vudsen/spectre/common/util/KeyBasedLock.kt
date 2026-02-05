package io.github.vudsen.spectre.common.util

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executor
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.locks.ReentrantLock

class KeyBasedLock(private val lockCleanExecutor: Executor) {

    companion object {
        private const val MAX_LOCK_SIZE = 150
        private const val LOCK_THRESHOLD = 100
    }

    private val locks = ConcurrentHashMap<String, ReentrantLock>()

    private val isCleaning = AtomicBoolean(false)

    private fun getLock(key: String): ReentrantLock = locks.computeIfAbsent(key) { ReentrantLock() }

    fun lock(key: String) = getLock(key).lock()

    fun tryLock(key: String): Boolean = getLock(key).tryLock()

    fun unlock(key: String) {
        val lock = locks[key]
        if (lock != null && lock.isHeldByCurrentThread) {
            lock.unlock()
        }

        if (locks.size > MAX_LOCK_SIZE && isCleaning.compareAndSet(false, true)) {
            lockCleanExecutor.execute {
                try {
                    var target = locks.size - LOCK_THRESHOLD
                    val iterator = locks.entries.iterator()
                    while (iterator.hasNext() && target > 0) {
                        val entry = iterator.next()
                        val l = entry.value
                        if (l.tryLock()) {
                            try {
                                if (!l.hasQueuedThreads()) {
                                    iterator.remove()
                                    target--
                                }
                            } finally {
                                l.unlock()
                            }
                        }
                    }
                } finally {
                    isCleaning.set(false)
                }
            }
        }
    }
}