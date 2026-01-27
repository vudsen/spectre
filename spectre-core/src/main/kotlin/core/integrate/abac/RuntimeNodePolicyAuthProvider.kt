package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.policy.PolicyAuthenticationProvider
import io.github.vudsen.spectre.api.perm.PolicyPermissionContext
import io.github.vudsen.spectre.api.perm.PolicyPermissions
import io.github.vudsen.spectre.api.plugin.policy.PolicyPermissionContextExample
import org.springframework.stereotype.Component
import java.sql.Timestamp

@Component
class RuntimeNodePolicyAuthProvider : PolicyAuthenticationProvider {

    override fun toContextMap(ctx: PolicyPermissionContext): MutableMap<String, Any> {
        ctx as RuntimeNodePolicyPermissionContext
        val map = mutableMapOf<String, Any>()
        map["runtimeNode"] = ctx.runtimeNode
        return map
    }

    override fun getPermissionEntity(): PermissionEntity {
        return PolicyPermissions.RUNTIME_NODE_TREE_EXPAND
    }


    override fun createExampleContext(): List<PolicyPermissionContextExample> {
        return buildList {
            add(PolicyPermissionContextExample(
                "展开树节点时",
                toContextMap(RuntimeNodePolicyPermissionContext(
                    RuntimeNodeDTO(-1, "Test", "Test", "{}", Timestamp(System.currentTimeMillis()), mapOf(Pair("foo", "bar")), false),
                    PolicyPermissions.RUNTIME_NODE_TREE_EXPAND
                ))
            ))
        }
    }

    override fun customiseErrorException(): BusinessException? {
        return null
    }


}