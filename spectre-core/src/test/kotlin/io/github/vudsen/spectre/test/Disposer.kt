package io.github.vudsen.spectre.test

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.DisposableBean
import org.springframework.stereotype.Component
import java.util.LinkedList

@Component
class Disposer : DisposableBean{

    private val logger = LoggerFactory.getLogger(Disposer::class.java)

    private val resources = LinkedList<Runnable>()

    fun registerDispose(runnable: Runnable) {
        resources.add(runnable)
    }

    override fun destroy() {
        for (runnable in resources) {
            try {
                runnable.run()
            } catch (e: Exception) {
                logger.error("Failed to close resource", e)
            }
        }
    }


}