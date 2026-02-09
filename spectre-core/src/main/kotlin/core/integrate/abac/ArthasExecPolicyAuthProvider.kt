package io.github.vudsen.spectre.core.integrate.abac

import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.perm.AppPermissions
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.policy.PolicyAuthenticationProvider
import io.github.vudsen.spectre.api.perm.PolicyPermissionContext
import io.github.vudsen.spectre.api.plugin.policy.PolicyPermissionContextExample
import io.github.vudsen.spectre.core.plugin.ssh.DockerJvm
import io.github.vudsen.spectre.core.plugin.ssh.LocalJvm
import io.github.vudsen.spectre.core.plugin.ssh.SshRuntimeNodeConfig
import org.springframework.stereotype.Component
import java.sql.Timestamp

@Component
class ArthasExecPolicyAuthProvider : PolicyAuthenticationProvider {

    override fun toContextMap(ctx: PolicyPermissionContext): MutableMap<String, Any> {
        val context = ctx as ArthasExecutionPolicyPermissionContext
        val ctxMap = mutableMapOf<String, Any>()

        ctxMap.put("commands", context.commands)
        ctxMap.put("runtimeNode", context.runtimeNodeDTO)
        ctxMap.put("jvm", context.jvm)
        return ctxMap
    }



    override fun getPermissionEntity(): PermissionEntity {
        return AppPermissions.RUNTIME_NODE_ARTHAS_EXECUTE
    }


    override fun createExampleContext():  List<PolicyPermissionContextExample> {
        return buildList {
            add(PolicyPermissionContextExample(
                "当连接 Docker 时",
                toContextMap(ArthasExecutionPolicyPermissionContext(
                    listOf("watch", "demo.MathGame primeFactors", "\"{params,returnObj}\"", "-x", "2", "-b"),
                    RuntimeNodeDTO(
                        -1,
                        "Test",
                        "Test",
                        SshRuntimeNodeConfig(SshRuntimeNodeConfig.Docker(true, "docker", null, null), null, "127.0.0.1", 22, "root",
                            SshRuntimeNodeConfig.LoginPrincipal(SshRuntimeNodeConfig.LoginType.KEY, null, null, null), "/opt/spectre"),
                        Timestamp(System.currentTimeMillis()),
                        mapOf(Pair("foo", "bar")),
                        false
                    ),
                    DockerJvm("1", "Test", 1)
                ))
            ))
            add(PolicyPermissionContextExample(
                "当连接本地 JVM 时",
                toContextMap(ArthasExecutionPolicyPermissionContext(
                    listOf("watch", "demo.MathGame primeFactors", "\"{params,returnObj}\"", "-x", "2", "-b"),
                    RuntimeNodeDTO(-1, "Test", "Test", SshRuntimeNodeConfig(null, SshRuntimeNodeConfig.Local(true, "/opt/jdk/bin/java"), "127.0.0.1", 22, "root",
                        SshRuntimeNodeConfig.LoginPrincipal(SshRuntimeNodeConfig.LoginType.KEY, null, null, null), "/opt/spectre"), Timestamp(System.currentTimeMillis()), mapOf(Pair("foo", "bar")), false),
                    LocalJvm("1", "Test")
                ))
            ))
        }

    }

    override fun customiseErrorException(): BusinessException? {
        return null
    }
}