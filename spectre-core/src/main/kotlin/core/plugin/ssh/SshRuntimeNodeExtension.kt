package io.github.vudsen.spectre.core.plugin.ssh

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.plugin.rnode.JvmAttachHandler
import io.github.vudsen.spectre.common.plugin.rnode.TypedRuntimeNodeExtensionPoint
import io.github.vudsen.spectre.api.entity.PageDescriptor
import org.apache.sshd.common.Factory
import org.apache.sshd.common.util.threads.CloseableExecutorService
import org.apache.sshd.common.util.threads.SshThreadPoolExecutor
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearchNode
import io.github.vudsen.spectre.api.plugin.rnode.JvmSearcher
import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig
import io.github.vudsen.spectre.common.plugin.rnode.SearchTreeBuilder
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit

/**
 * 使用 ssh 连接远程服务器。支持下面的 JVM：
 * - 本地的 JVM
 * - Docker 中的 JVM
 */
@Component
class SshRuntimeNodeExtension : TypedRuntimeNodeExtensionPoint<SshRuntimeNodeConfig, SshRuntimeNode>("SSH") {

    private lateinit var objectMapper: ObjectMapper

    private val executor = SshThreadPoolExecutor(1, 4, 1L, TimeUnit.MINUTES, ArrayBlockingQueue(16))

    inner class MyCloseableExecutorService : Factory<CloseableExecutorService> {
        override fun create(): CloseableExecutorService? {
            return executor
        }
    }

    @Autowired
    fun setObjectMapper(objectMapper: ObjectMapper) {
        this.objectMapper = objectMapper
    }


    private val searcher: JvmSearcher by lazy {
        val builder = SearchTreeBuilder.create()

        val localHost = builder.addHandler<Nothing?> { runtimeNode, ctx ->
            runtimeNode as SshRuntimeNode
            val configuration = runtimeNode.getConfiguration()
            if (configuration.local?.enabled == true) {
                return@addHandler listOf(JvmSearchNode("Localhost", false, null))
            }
            return@addHandler emptyList()
        }

        val docker = builder.addHandler<Nothing?> { runtimeNode, ctx ->
            runtimeNode as SshRuntimeNode
            val configuration = runtimeNode.getConfiguration()
            if (configuration.docker?.enabled == true) {
                return@addHandler listOf(JvmSearchNode("Docker", false, null))
            }
            return@addHandler emptyList()
        }

        val localImpl = localHost.addHandler { runtimeNode, ctx ->
            runtimeNode as SshRuntimeNode
            val local = runtimeNode.getConfiguration().local
            if (local != null && local.enabled) {
                return@addHandler listAllLocalContainers(runtimeNode, local)
            }
            return@addHandler emptyList()
        }

        val dockerImpl = docker.addHandler { runtimeNode, ctx ->
            runtimeNode as SshRuntimeNode
            val docker = runtimeNode.getConfiguration().docker
            if (docker != null && docker.enabled) {
                return@addHandler listContainers(runtimeNode, docker)
            }
            return@addHandler emptyList()
        }

        return@lazy builder.build { node ->
            if (node.pcFlag == localImpl.getCurrentPc() || node.pcFlag == dockerImpl.getCurrentPc()) {
                return@build node.ctx as Jvm
            }
            throw IllegalArgumentException("Unknown pc: ${node.pcFlag}")
        }
    }


    private fun listContainers(
        runtimeNode: SshRuntimeNode,
        conf: SshRuntimeNodeConfig.Docker
    ): List<JvmSearchNode<DockerJvm>> {
        val ps = runtimeNode.execute("${conf.executablePath} ps --format=json").ok()

        val containers = ps.split('\n')
        val result = mutableListOf<JvmSearchNode<DockerJvm>>()
        for (container in containers) {
            if (container.isEmpty()) {
                continue
            }
            val tree = objectMapper.readTree(container)
            val name = "${tree["Names"]!!.asText()}(${tree["Image"]!!.asText()})"
            val jvm = DockerJvm(tree["ID"]!!.asText(), name)
            result.add(
                JvmSearchNode(jvm.name, true, jvm)
            )
        }
        return result
    }


    private fun listAllLocalContainers(
        runtimeNode: SshRuntimeNode,
        conf: SshRuntimeNodeConfig.Local
    ): List<JvmSearchNode<LocalJvm>> {
        val jps = "${conf.javaHome}/bin/jps"
        val out: String = runtimeNode.execute("${jps} -l").let {
            if (it.exitCode == 0) {
                return@let it.stdout
            } else {
                return@let runtimeNode.grep("java", "ps", "-eo", "pid,command").ok()
            }
        }

        return parseLocalJvmOutput(out).map { jvm -> JvmSearchNode(jvm.name, true, jvm) }
    }

    private fun parseLocalJvmOutput(output: String): List<LocalJvm> {
        val lines = output.split("\n")
        val result = ArrayList<LocalJvm>(lines.size)

        for (l in lines) {
            val line = l.trim()
            val i = line.indexOf(' ')
            if (i < 0) {
                continue
            }
            val command = line.substring(i + 1)
            if (command.contains("grep java") || command.endsWith("Jps")) {
                continue
            }
            val pid = line.substring(0, i)

            result.add(LocalJvm(pid, command))
        }
        return result
    }

    override fun getDescription(): String {
        return """
            使用 SSH 连接到你的远程服务器，支持使用本地/Docker 中的 JVM 作为数据源使用。
        """.trimIndent()
    }

    override fun typedGetConfigurationForm(oldConfiguration: SshRuntimeNodeConfig?): PageDescriptor {
        return PageDescriptor("form/SshConfForm", oldConfiguration, "")
    }

    override fun getConfigurationClass(): Class<SshRuntimeNodeConfig> {
        return SshRuntimeNodeConfig::class.java
    }

    override fun typedCreateRuntimeNode(config: SshRuntimeNodeConfig): SshRuntimeNode {
        return SshRuntimeNode().apply {
            nodeConfig = config
            executorServiceFactory = MyCloseableExecutorService()
        }
    }

    override fun typedTest(conf: SshRuntimeNodeConfig) {
        val node = typedCreateRuntimeNode(conf)
        try {
            node.test()
        } finally {
            node.close()
        }
    }

    override fun runtimeNodeClass(): Class<*> {
        return SshRuntimeNode::class.java
    }

    override fun isCloseableRuntimeNode(): Boolean {
        return true
    }


    override fun typedFilterSensitiveConfiguration(conf: SshRuntimeNodeConfig) {
        conf.principal ?.let {
            it.secretKey = ""
            it.password = ""
            it.secretKeyPassword = ""
        }
    }

    override fun typedFillSensitiveConfiguration(
        updated: SshRuntimeNodeConfig,
        base: SshRuntimeNodeConfig
    ): RuntimeNodeConfig {
        val basePrincipal = base.principal ?: return updated
        updated.principal ?.let {
            if (it.password.isNullOrEmpty()) {
                it.password = basePrincipal.password
            }
            if (it.secretKey.isNullOrEmpty()) {
                it.secretKey = basePrincipal.secretKey
            }
            if (it.secretKeyPassword.isNullOrEmpty()) {
                it.secretKeyPassword = basePrincipal.secretKeyPassword
            }
        }
        return updated
    }

    override fun createSearcher(): JvmSearcher {
        return searcher
    }


    override fun typedCreateAttachHandler(
        runtimeNode: SshRuntimeNode,
        jvm: Jvm,
        bundles: ToolchainBundleDTO
    ): JvmAttachHandler {
        return SshAttachHandler(runtimeNode, jvm, bundles)
    }


    override fun getId(): String {
        return "RuntimeNode:LocalRuntimeNodeExtensionPoint"
    }


}