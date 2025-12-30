package io.github.vudsen.spectre.core.lock

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.locks.ReentrantLock

class InMemoryDistributedLock : DistributedLock {

    private val locks = ConcurrentHashMap<String, ReentrantLock>()

    private val modifyLock = ReentrantLock()

    private fun lock0(key: String, isTry: Boolean): Boolean {
        val e = locks[key]
        val entry: ReentrantLock = if (e == null) {
            modifyLock.lock()
            try {
                val lc = locks[key]
                if (lc == null) {
                    val lockEntry = ReentrantLock()
                    locks[key] = lockEntry
                    lockEntry
                } else {
                    lc
                }
            } finally {
                modifyLock.unlock()
            }
        } else {
            e
        }
        if (isTry) {
            return entry.tryLock()
        } else {
            entry.lock()
            return true
        }
    }

    override fun lock(key: String) {
        lock0(key, false)
    }

    override fun unlock(key: String) {
        locks[key]?.unlock()
        if (locks.size > 100) {
            modifyLock.lock()
            try {
                locks.remove(key)
            } finally {
                modifyLock.unlock()
            }
        }
    }

    override fun tryLock(key: String): Boolean {
        return lock0(key, true)
    }
}