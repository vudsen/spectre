package io.github.vudsen.spectre.core.plugin.abac

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.fasterxml.jackson.databind.node.ArrayNode
import io.github.vudsen.spectre.api.entity.TypedPageDescriptor
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.PermissionDenyException
import io.github.vudsen.spectre.api.perm.AppPermissions
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.EnhancePolicyAuthenticationExtensionPoint
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

@Component
class ArthasExecutionEnhancePolicyAuthenticationExtension : EnhancePolicyAuthenticationExtensionPoint() {

    companion object {
        const val ID = "PolicyAuthenticationExtensionPoint:ArthasExecutionPolicyAuthenticationExtension"
        private val arthasCommands = setOf(
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
            "watch"
        )
    }

    class LimitCommandsSerializer : JsonDeserializer<Set<String>>() {
        override fun deserialize(
            p: JsonParser?,
            ctxt: DeserializationContext?
        ): Set<String> {
            val node: ArrayNode = p!!.getCodec().readTree(p) ?: return emptySet()
            val values = mutableSetOf<String>()
            for (element in node) {
                val command = element.asText()
                if (!arthasCommands.contains(command)) {
                    throw BusinessException("未知命令: $command")
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

    override fun getEnhanceTarget(): PermissionEntity {
        return AppPermissions.RUNTIME_NODE_ARTHAS_EXECUTE
    }

    override fun getConfigurationPage(): TypedPageDescriptor<EnhancePageParameterVO> {
        return TypedPageDescriptor(
            "form/ArthasExecutionPermissionFrom",
            EnhancePageParameterVO(getId())
        )
    }

    override fun hasPermission(
        context: Map<String, Any>,
        conf: Any
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

    override fun getConfigurationClass(): Class<*> {
        return ArthasExecutionConfiguration::class.java
    }

    override fun getId(): String {
        return ID
    }

    override fun getExtensionPointName(): String {
        return "Arthas Command Execution Control"
    }


}