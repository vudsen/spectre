package io.github.vudsen.spectre.core.lock

/**
 * ~~分布式~~锁. 在实现时需要考虑由于网络原因导致无法解锁的情况。
 */
interface DistributedLock {

    /**
     * 锁定. 不支持重入.
     *
     *
     */
    fun lock(key: String)

    /**
     * 解锁.
     */
    fun unlock(key: String)

    /**
     * 尝试锁定
     */
    fun tryLock(key: String): Boolean

}