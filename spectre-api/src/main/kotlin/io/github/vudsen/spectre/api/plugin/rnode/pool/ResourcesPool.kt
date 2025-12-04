package io.github.vudsen.spectre.api.plugin.rnode.pool

import io.github.vudsen.spectre.api.exception.BusinessException
import org.slf4j.LoggerFactory
import io.github.vudsen.spectre.api.plugin.rnode.CloseableRuntimeNode
import java.io.Closeable
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedTransferQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock

class ResourcesPool(private val factory: RuntimeNodeFactory) : Closeable {

    companion object {
        private val logger = LoggerFactory.getLogger(ResourcesPool::class.java)
        private const val QUEUE_SIZE = 3
    }

    private val pool: BlockingQueue<CloseableRuntimeNode> = LinkedTransferQueue()

    @Volatile
    private var count = 0

    private val modifyLock = ReentrantLock()

    private fun waitForResource(): CloseableRuntimeNode {
        val res = pool.poll(3, TimeUnit.SECONDS)
        if (res == null) {
            throw BusinessException("系统繁忙，请稍后再试")
        }
        return res
    }

    /**
     * 尝试创建资源。
     *
     * 如果队列已满，则会等待其它资源返回，不会创建新的资源
     */
    private fun tryCreateResource(): CloseableRuntimeNode {
        if (count >= QUEUE_SIZE) {
            return waitForResource()
        }
        modifyLock.lockInterruptibly()
        if (count >= QUEUE_SIZE) {
            modifyLock.unlock()
            return waitForResource()
        }
        return try {
            val runtimeNode = factory.createInstance()
            pool.add(runtimeNode)
            count++
            runtimeNode
        } finally {
            modifyLock.unlock()
        }
    }

    fun borrow(): CloseableRuntimeNode {
        val res = pool.poll()
        if (res == null) {
            if (count < QUEUE_SIZE) {
                return tryCreateResource()
            }
        }
        if (res.isAlive()) {
            return res
        }
        return tryCreateResource()
    }

    fun retrieve(node: CloseableRuntimeNode) {
        try {
            pool.add(node)
        } catch (e: Exception) {
            modifyLock.lockInterruptibly()
            try {
                count--
            } finally {
                modifyLock.unlock()
            }
            node.close()
            logger.error("Failed to retrieve resource.", e)
        }
    }

    override fun close() {
        TODO("Not yet implemented")
    }

}
