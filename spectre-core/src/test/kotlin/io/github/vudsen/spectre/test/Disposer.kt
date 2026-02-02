package io.github.vudsen.spectre.test

import org.junit.jupiter.api.extension.Extension
import org.slf4j.LoggerFactory
import java.io.Closeable
import java.util.LinkedList

class Disposer : Closeable, Extension {

    companion object {
        @JvmStatic
        private val logger = LoggerFactory.getLogger(Disposer::class.java)
    }

    private val resources = LinkedList<Runnable>()

    fun registerDispose(runnable: Runnable) {
        resources.add(runnable)
    }

    override fun close() {
        for (runnable in resources) {
            try {
                runnable.run()
            } catch (e: Exception) {
                logger.error("Failed to close resource", e)
            }
        }
    }


}