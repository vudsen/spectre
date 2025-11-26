package io.github.vudsen.spectre.api.plugin.rnode.pool

import org.springframework.cglib.proxy.MethodInterceptor
import org.springframework.cglib.proxy.MethodProxy
import java.lang.reflect.Method

class CloseableRuntimeNodeMethodInterceptor : MethodInterceptor {

    override fun intercept(
        obj: Any?,
        method: Method?,
        args: Array<out Any?>?,
        proxy: MethodProxy?
    ): Any? {
        TODO("Not yet implemented")
    }

}