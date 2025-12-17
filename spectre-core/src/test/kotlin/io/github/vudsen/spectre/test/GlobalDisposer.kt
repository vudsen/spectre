package io.github.vudsen.spectre.test

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.DisposableBean
import org.springframework.stereotype.Component
import java.util.LinkedList

@Component
class GlobalDisposer : DisposableBean{

    private val disposer = Disposer()

    fun registerDispose(runnable: Runnable) {
        disposer.registerDispose(runnable)
    }

    override fun destroy() {
        disposer.close()
    }


}