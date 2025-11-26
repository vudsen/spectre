package io.github.vudsen.spectre.api.plugin.rnode.pool

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

    private fun createResource(): CloseableRuntimeNode {
        modifyLock.lockInterruptibly()
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
                count--
                createResource()
            } finally {
                modifyLock.unlock()
            }
            node.test()
            return node
        }

        if (count == QUEUE_SIZE) {
            val res = pool.poll(5, TimeUnit.SECONDS)
            if (res == null) {
                TODO("提示用户资源繁忙")
            }
            return res
        }
        val node = createResource()
        node.test()
        return node
    }

    fun retrieve(node: CloseableRuntimeNode) {
        try {
            pool.add(node)
        } catch (e: Exception) {
            logger.error("", e)
        }
    }

    override fun close() {
        TODO("Not yet implemented")
    }

}
