package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.common.plugin.rnode.ToolchainPaths
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.common.plugin.rnode.AbstractShellAvailableAttachHandler
import io.github.vudsen.spectre.api.plugin.rnode.ArthasHttpClient
import io.github.vudsen.spectre.common.plugin.rnode.ShellBasedArthasHttpClient
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.common.plugin.rnode.ShellAvailableRuntimeNode
import java.util.regex.Pattern
import kotlin.random.Random

class SshAttachHandler(
    runtimeNode: SshRuntimeNode,
    jvm: Jvm,
    bundles: ToolchainBundleDTO
) : AbstractShellAvailableAttachHandler<SshRuntimeNode>(runtimeNode, jvm, bundles) {

    companion object {
        private val whiteSpaces =  Pattern.compile(" +")
        private const val DOCKER_LISTEN_PORT = 37555
    }

    override fun doAttach(
        port: Int?,
        paths: ToolchainPaths,
    ): ArthasHttpClient {
        val jvm = jvm
        if (jvm is LocalJvm) {
            // 本地服务器一般都有 ss 命令，可以用随机端口
            return attachLocal(port != null, paths, port ?: Random.nextInt(10000, 65535), jvm)
        } else if (jvm is DockerJvm) {
            return attachDocker(jvm, paths, port != null)
        }
        throw AppException("Unsupported jvm: $jvm, class: ${jvm::class.java}")
    }

    private fun attachDocker(
        jvm: DockerJvm,
        paths: ToolchainPaths,
        expectBound: Boolean,
    ): ShellBasedArthasHttpClient {
        val dockerCnf = runtimeNode.nodeConfig.docker
        if (dockerCnf == null || !dockerCnf.enabled) {
            throw BusinessException("未提供 Docker 相关配置")
        }

        val dockerNode = DockerRuntimeNode(
            runtimeNode,
            dockerCnf.executablePath,
            jvm.id,
            runtimeNode.getExtPoint() as SshRuntimeNodeExtension
        )

        val uid = dockerNode.execute("id -u").tryUnwrap()?.trim() ?: "0"
        val gid = dockerNode.execute("id -g").tryUnwrap()?.trim() ?: "0"

        dockerNode.user = "root"
        val home = dockerCnf.spectreHome ?: runtimeNode.nodeConfig.spectreHome
        val arthasHome = "$home/arthas"
        val httpClientPath = "$home/http-client.jar"
        val jattachPath = "$home/jattach"
        val readyFlag = "$home/READY.flag"
        if (!dockerNode.isDirectoryExist(home) || !dockerNode.isFileExist(readyFlag)) {
            dockerNode.mkdirs(arthasHome)
            runtimeNode.execute("docker cp ${paths.httpClientPath} ${jvm.id}:$httpClientPath").ok()
            runtimeNode.execute("docker cp ${paths.jattachPath} ${jvm.id}:$jattachPath").ok()
            runtimeNode.execute("docker cp ${paths.arthasHome}/. ${jvm.id}:$arthasHome").ok()
            if (uid != "0") {
                dockerNode.execute("chown -R $uid:$gid $home").ok()
            }
            dockerNode.execute("touch $readyFlag").ok()
        }
        dockerNode.user = null
        if (!expectBound) {
            dockerNode.execute("$jattachPath ${jvm.pid} load instrument false \"${arthasHome}/arthas-agent.jar=;httpPort=$DOCKER_LISTEN_PORT;telnetPort=-1;\"")
                .ok()
        }
        return ShellBasedArthasHttpClient(
            dockerNode,
            httpClientPath,
            "http://127.0.0.1:${DOCKER_LISTEN_PORT}/api",
            if (dockerCnf.javaHome == null) {
                "java"
            } else {
                "${dockerCnf.javaHome}/bin/java"
            }
        )
    }

    private fun attachLocal(
        expectBound: Boolean,
        paths: ToolchainPaths,
        port: Int,
        jvm: LocalJvm
    ): ShellBasedArthasHttpClient {
        val localConf = runtimeNode.nodeConfig.local
        if (localConf == null || !localConf.enabled) {
            throw BusinessException("未提供本地 JVM 相关配置")
        }

        if (expectBound) {
            val client = ShellBasedArthasHttpClient(
                runtimeNode,
                paths.httpClientPath,
                "http://127.0.0.1:${port}/api",
                "${localConf.javaHome}/bin/java"
            )
            return client
        }
        runtimeNode.execute("${paths.jattachPath} ${jvm.id} load instrument false \"${paths.arthasHome}/arthas-agent.jar=;httpPort=$port;telnetPort=-1;\"")
            .ok()

        return ShellBasedArthasHttpClient(
            runtimeNode,
            paths.httpClientPath,
            "http://127.0.0.1:$port/api",
            if (localConf.javaHome.isNullOrEmpty()) { "java" } else { "${localConf.javaHome}/bin/java" }
        )
    }

    override fun resolveSpectreHome(): String {
        return runtimeNode.nodeConfig.spectreHome
    }

    override fun tryFindClient(paths: ToolchainPaths): ArthasHttpClient? {
        val jvm = jvm
        if (jvm is LocalJvm) {
            return tryFindLocalClient(runtimeNode, jvm.id.toInt(), paths)
        } else if (jvm is DockerJvm) {
            return tryFindLocalClient(runtimeNode, jvm.pid, paths) ?: doAttach(DOCKER_LISTEN_PORT, paths)
        }
        return null
    }


    private fun tryFindLocalClient(runtimeNode: ShellAvailableRuntimeNode, processPid: Int, paths: ToolchainPaths): ArthasHttpClient? {
        val data = runtimeNode.execute("ss -tulnp | grep $processPid").tryUnwrap() ?: return null
        val binds = data.split("\n")
        for (bind in binds) {
            val dataLine = bind.split(whiteSpaces)
            if (dataLine.size < 4) {
                continue
            }
            val mayBePort = dataLine[4]
            val pos = mayBePort.lastIndexOf(':')
            if (pos < 0) {
                continue
            }
            val port = try {
                mayBePort.substring(pos + 1).toInt()
            } catch (_: NumberFormatException) {
                continue
            }
            try {
                val client = doAttach(port, paths)
                client.test()
                return client
            } catch (_: Exception) { }
        }
        return null
    }
}