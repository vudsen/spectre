package io.github.vudsen.spectre.test

import org.springframework.beans.factory.DisposableBean

object GlobalDisposer : DisposableBean {

    private val disposer = Disposer()

    fun registerDispose(runnable: Runnable) {
        disposer.registerDispose(runnable)
    }

    override fun destroy() {
        disposer.close()
    }


}