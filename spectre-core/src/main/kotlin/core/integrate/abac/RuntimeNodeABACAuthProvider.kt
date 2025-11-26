package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.plugin.policy.ABACAuthenticationProvider
import io.github.vudsen.spectre.api.perm.ABACContext
import io.github.vudsen.spectre.api.perm.ABACPermissions
import org.springframework.stereotype.Component
import java.sql.Timestamp

@Component
class RuntimeNodeABACAuthProvider : ABACAuthenticationProvider {

    override fun toContextMap(ctx: ABACContext): MutableMap<String, Any> {
        ctx as RuntimeNodeABACContext
        val map = mutableMapOf<String, Any>()
        map["runtimeNode"] = ctx.runtimeNode
        return map
    }

    override fun isSupport(clazz: Class<out ABACContext>): Boolean {
        return clazz == RuntimeNodeABACContext::class.java
    }

    override fun createTestContext(): ABACContext {
        return RuntimeNodeABACContext(
            RuntimeNodeDTO(-1, "Test", "Test", "{}", Timestamp(System.currentTimeMillis()), emptyMap()),
            ABACPermissions.RUNTIME_NODE_TREE_EXPAND
        )
    }


}