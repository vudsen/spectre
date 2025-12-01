package io.github.vudsen.spectre.api.plugin.rnode.pool

import io.github.vudsen.spectre.api.exception.BusinessException
import org.slf4j.LoggerFactory
import io.github.vudsen.spectre.api.plugin.rnode.CloseableRuntimeNode
import java.io.Closeable
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.BlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock

class ResourcesPool(private val factory: RuntimeNodeFactory) : Closeable {

    companion object {
        private val logger = LoggerFactory.getLogger(ResourcesPool::class.java)
        private const val QUEUE_SIZE = 3
    }

    private val pool: BlockingQueue<CloseableRuntimeNode> = ArrayBlockingQueue(QUEUE_SIZE)

    @Volatile
    private var count = 0

    private val modifyLock = ReentrantLock()

    private fun createResource(isNewOne: Boolean): CloseableRuntimeNode {
        // TODO 容量满的时候不再创建
        modifyLock.lockInterruptibly()
        return try {
            val runtimeNode = factory.createInstance()
            pool.add(runtimeNode)
            if (isNewOne) {
                count++
            }
            runtimeNode
        } finally {
            modifyLock.unlock()
        }
    }

    fun borrow(): CloseableRuntimeNode {
        while (true) {
            val res = pool.poll()
            if (res == null) {
                break
            }
            if (res.isAlive()) {
                return res
            }
            modifyLock.lockInterruptibly()
            val node = try {
                // 替换节点
                createResource(false)
            } finally {
                modifyLock.unlock()
            }
            node.ensureAttachEnvironmentReady()
            return node
        }

        if (count >= QUEUE_SIZE) {
            val res = pool.poll(5, TimeUnit.SECONDS)
            if (res == null) {
                throw BusinessException("系统繁忙，请稍后再试")
            }
            return res
        }
        val node = createResource(true)
        return node
    }

    fun retrieve(node: CloseableRuntimeNode) {
        try {
            pool.add(node)
        } catch (e: Exception) {
            node.close()
            logger.error("Failed to retrieve resource.", e)
        }
    }

    override fun close() {
        TODO("Not yet implemented")
    }

}
