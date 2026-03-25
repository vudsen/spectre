package io.github.vudsen.spectre.core.plugin.abac

import io.github.vudsen.spectre.api.entity.TypedPageDescriptor
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.PermissionDenyException
import io.github.vudsen.spectre.api.perm.AppPermissions
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.EnhancePolicyAuthenticationExtensionPoint
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import tools.jackson.core.JsonParser
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.ValueDeserializer
import tools.jackson.databind.annotation.JsonDeserialize
import tools.jackson.databind.node.ArrayNode

@Component
class ArthasExecutionEnhancePolicyAuthenticationExtension : EnhancePolicyAuthenticationExtensionPoint() {
    companion object {
        const val ID = "PolicyAuthenticationExtensionPoint:ArthasExecutionPolicyAuthenticationExtension"
        private val arthasCommands =
            setOf(
                "auth",
                "base64",
                "cat",
                "classloader",
                "cls",
                "dashboard",
                "dump",
                "echo",
                "getstatic",
                "grep",
                "heapdump",
                "help",
                "history",
                "jad",
                "jfr",
                "jvm",
                "keymap",
                "logger",
                "mbean",
                "mc",
                "memory",
                "monitor",
                "ognl",
                "options",
                "perfcounter",
                "profiler",
                "pwd",
                "quit",
                "redefine",
                "reset",
                "retransform",
                "sc",
                "session",
                "sm",
                "stack",
                "stop",
                "sysenv",
                "sysprop",
                "tee",
                "thread",
                "trace",
                "tt",
                "version",
                "vmoption",
                "vmtool",
                "watch",
            )
    }

    class LimitCommandsSerializer : ValueDeserializer<Set<String>>() {
        override fun deserialize(
            p: JsonParser?,
            ctxt: DeserializationContext?,
        ): Set<String> {
            val node: ArrayNode = p!!.readValueAsTree() ?: return emptySet()
            val values = mutableSetOf<String>()
            for (element in node) {
                val command = element.asString()
                if (!arthasCommands.contains(command)) {
                    throw BusinessException("error.command.unknown", arrayOf(command))
                }
                values.add(command)
            }
            return values
        }
    }

    class ArthasExecutionConfiguration {
        @JsonDeserialize(using = LimitCommandsSerializer::class)
        var allowedCommands: Set<String> = emptySet()
        var allowUnknownCommand: Boolean = false
        var allowRedirect: Boolean = false
    }

    override fun getEnhanceTarget(): PermissionEntity = AppPermissions.RUNTIME_NODE_ARTHAS_EXECUTE

    override fun getConfigurationPage(): TypedPageDescriptor<EnhancePageParameterVO> =
        TypedPageDescriptor(
            "form/ArthasExecutionPermissionFrom",
            EnhancePageParameterVO(getId()),
        )

    override fun hasPermission(
        context: Map<String, Any>,
        conf: Any,
    ): Boolean {
        val commands = context["commands"] as List<String>
        conf as ArthasExecutionConfiguration
        val command = commands[0]
        if (!arthasCommands.contains(command)) {
            // unknown command.
            if (!conf.allowUnknownCommand) {
                throw PermissionDenyException("您没有执行未知命令的权限", emptyArray()).apply {
                    httpStatus = HttpStatus.FORBIDDEN.value()
                }
            }
        } else if (!conf.allowedCommands.contains(command)) {
            throw PermissionDenyException("您没有执行${command}的权限", emptyArray()).apply {
                httpStatus = HttpStatus.FORBIDDEN.value()
            }
        }
        if (commands.indexOf(">") >= 0 || commands.indexOf("<") >= 0) {
            if (!conf.allowRedirect) {
                throw PermissionDenyException("您没有执行使用重定向符的权限", emptyArray()).apply {
                    httpStatus = HttpStatus.FORBIDDEN.value()
                }
            }
        }
        return true
    }

    override fun getConfigurationClass(): Class<*> = ArthasExecutionConfiguration::class.java

    override fun getId(): String = ID

    override fun getExtensionPointName(): String = "Arthas Command Execution Control"
}
