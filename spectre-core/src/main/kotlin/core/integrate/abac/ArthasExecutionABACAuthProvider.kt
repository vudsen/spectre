package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.plugin.policy.ABACAuthenticationProvider
import io.github.vudsen.spectre.api.perm.ABACContext
import org.springframework.stereotype.Component

@Component
class ArthasExecutionABACAuthProvider : ABACAuthenticationProvider {

    override fun toContextMap(ctx: ABACContext): MutableMap<String, Any> {
        val context = ctx as ArthasExecutionABACContext
        val ctxMap = mutableMapOf<String, Any>()

        ctxMap.put("command", context.command)
        ctxMap.put("runtimeNodeDTO", context.runtimeNodeDTO)
        ctxMap.put("jvm", context.jvm)
        return ctxMap
    }

    override fun isSupport(clazz: Class<out ABACContext>): Boolean {
        return clazz == ArthasExecutionABACContext::class.java
    }

    override fun createTestContext(): ABACContext {
        TODO("Not yet implemented")
    }
}