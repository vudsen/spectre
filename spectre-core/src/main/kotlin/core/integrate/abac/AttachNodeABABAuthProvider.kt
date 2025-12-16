package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.perm.ABACContext
import io.github.vudsen.spectre.api.perm.ABACPermissions
import io.github.vudsen.spectre.api.plugin.policy.ABACAuthenticationProvider
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import org.springframework.stereotype.Component
import java.sql.Timestamp

@Component
class AttachNodeABABAuthProvider : ABACAuthenticationProvider {
    override fun toContextMap(ctx: ABACContext): MutableMap<String, Any> {
        ctx as AttachNodeABACContext
        val map = mutableMapOf<String, Any>()
        map["nodeName"] = ctx.node.name
        map["runtimeNode"] = ctx.runtimeNode
        return map
    }

    override fun isSupport(clazz: Class<out ABACContext>): Boolean {
        return clazz == AttachNodeABACContext::class.java
    }

    override fun createTestContext(): ABACContext {
        return AttachNodeABACContext(
            ABACPermissions.RUNTIME_NODE_ATTACH,
            RuntimeNodeDTO(-1, "Test", "Test", "{}", Timestamp(System.currentTimeMillis()), emptyMap(), false),
            JvmSearchNode("Hello", false, null)
        )
    }

    override fun customiseErrorException(): BusinessException? {
        return BusinessException("您没有 Attach 该 JVM 的权限")
    }
}