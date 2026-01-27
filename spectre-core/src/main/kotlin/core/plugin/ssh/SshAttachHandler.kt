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
        private const val FLAG_VERSION = 1
    }

    override fun doAttach(
        port: Int?,
        password: String,
        paths: ToolchainPaths,
    ): ArthasHttpClient {
        val jvm = jvm
        if (jvm is LocalJvm) {
            // 本地服务器一般都有 ss 命令，可以用随机端口
            return attachLocal(port != null, password, paths, port ?: Random.nextInt(10000, 65535), jvm)
        } else if (jvm is DockerJvm) {
            return attachDocker(jvm, paths, port != null, password)
        }
        throw AppException("Unsupported jvm: $jvm, class: ${jvm::class.java}")
    }

    private fun isNotLatest(node: DockerRuntimeNode, flagPath: String): Boolean {
        val result = node.execute("cat $flagPath")
        if (result.isFailed()) {
            return true
        }
        return try {
            result.ok().toInt() != FLAG_VERSION
        } catch (_: NumberFormatException) {
            true
        }
    }

    private fun attachDocker(
        jvm: DockerJvm,
        paths: ToolchainPaths,
        expectBound: Boolean,
        password: String
    ): ShellBasedArthasHttpClient {
        val dockerCnf = runtimeNode.nodeConfig.docker
        if (dockerCnf == null || !dockerCnf.enabled) {
            throw BusinessException("未提供 Docker 相关配置")
        }

        val containerHomePath = dockerCnf.spectreHome ?: runtimeNode.nodeConfig.spectreHome
        val dockerNode = DockerRuntimeNode(
            runtimeNode,
            dockerCnf.executablePath,
            jvm.id,
            containerHomePath
        ).apply {
            setExtPoint(runtimeNode.getExtPoint())
        }

        val uid = dockerNode.execute("id -u").tryUnwrap()?.trim() ?: "0"
        val gid = dockerNode.execute("id -g").tryUnwrap()?.trim() ?: "0"

        dockerNode.user = "root"
        val arthasHome = "$containerHomePath/arthas"
        val httpClientPath = "$containerHomePath/http-client.jar"
        val jattachPath = "$containerHomePath/jattach"
        val readyFlag = "$containerHomePath/READY.flag"
        if (isNotLatest(dockerNode, readyFlag)) {
            dockerNode.mkdirs(arthasHome)
            // downloads 是给 retransform 或者其它命令用
            dockerNode.mkdirs("$containerHomePath/downloads")
            runtimeNode.execute("docker cp ${paths.httpClientPath} ${jvm.id}:$httpClientPath").ok()
            runtimeNode.execute("docker cp ${paths.jattachPath} ${jvm.id}:$jattachPath").ok()
            runtimeNode.execute("docker cp ${paths.arthasHome}/. ${jvm.id}:$arthasHome").ok()
            if (uid != "0") {
                dockerNode.execute("chown -R $uid:$gid $containerHomePath").ok()
            }
            dockerNode.execute("sh -c 'echo $FLAG_VERSION' > $readyFlag").ok()
        }
        dockerNode.user = null
        if (!expectBound) {
            dockerNode.execute("$jattachPath ${jvm.pid} load instrument false \"${arthasHome}/arthas-agent.jar=;localConnectionNonAuth=false;password=${password};httpPort=$DOCKER_LISTEN_PORT;telnetPort=-1;\"")
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
            },
            password
        )
    }

    private fun attachLocal(
        expectBound: Boolean,
        password: String,
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
                "${localConf.javaHome}/bin/java",
                password
            )
            return client
        }
        runtimeNode.execute("${paths.jattachPath} ${jvm.id} load instrument false \"${paths.arthasHome}/arthas-agent.jar=;localConnectionNonAuth=false;password=${password};httpPort=$port;telnetPort=-1;\"")
            .ok()

        return ShellBasedArthasHttpClient(
            runtimeNode,
            paths.httpClientPath,
            "http://127.0.0.1:$port/api",
            if (localConf.javaHome.isNullOrEmpty()) { "java" } else { "${localConf.javaHome}/bin/java" },
            password
        )
    }


    override fun tryFindClient(password: String, paths: ToolchainPaths): ArthasHttpClient? {
        val jvm = jvm
        if (jvm is LocalJvm) {
            return tryFindLocalClient(runtimeNode, jvm.id.toInt(), paths, password)
        } else if (jvm is DockerJvm) {
            return doAttach(DOCKER_LISTEN_PORT, password, paths)
        }
        return null
    }


    private fun tryFindLocalClient(runtimeNode: ShellAvailableRuntimeNode, processPid: Int, paths: ToolchainPaths, password: String): ArthasHttpClient? {
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
                val client = doAttach(port, password, paths)
                client.test()
                return client
            } catch (_: Exception) { }
        }
        return null
    }
}