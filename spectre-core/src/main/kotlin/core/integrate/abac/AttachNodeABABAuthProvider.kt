package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.perm.AppPermissions
import io.github.vudsen.spectre.api.perm.PolicyPermissionContext
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.policy.PolicyPermissionContextExample
import io.github.vudsen.spectre.api.plugin.policy.PolicyAuthenticationProvider
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.core.plugin.test.TestRuntimeNodeConfig
import org.springframework.stereotype.Component
import java.sql.Timestamp

@Component
class AttachNodeABABAuthProvider : PolicyAuthenticationProvider {
    override fun toContextMap(ctx: PolicyPermissionContext): MutableMap<String, Any> {
        ctx as AttachNodePolicyPermissionContext
        val map = mutableMapOf<String, Any>()
        map["nodeName"] = ctx.node.name
        map["runtimeNode"] = ctx.runtimeNode
        return map
    }


    override fun getPermissionEntity(): PermissionEntity {
        return AppPermissions.RUNTIME_NODE_ATTACH
    }


    override fun createExampleContext(): List<PolicyPermissionContextExample> {
        return buildList {
            add(PolicyPermissionContextExample(
                "连接节点时",
                toContextMap(AttachNodePolicyPermissionContext(
                    AppPermissions.RUNTIME_NODE_ATTACH,
                    RuntimeNodeDTO(-1, "Test", "Test", TestRuntimeNodeConfig(), Timestamp(System.currentTimeMillis()), mapOf(Pair("foo", "bar")), false),
                    JvmSearchNode("Hello", false, null)
                ))
            ))
        }
    }

    override fun customiseErrorException(): BusinessException? {
        return BusinessException("您没有 Attach 该 JVM 的权限")
    }
}