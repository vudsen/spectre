package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.entity.CommandExecuteResult
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.plugin.rnode.CloseableRuntimeNode
import io.github.vudsen.spectre.api.plugin.rnode.InteractiveShell
import io.github.vudsen.spectre.common.plugin.rnode.AbstractShellRuntimeNode
import org.apache.sshd.client.SshClient
import org.apache.sshd.client.channel.ChannelExec
import org.apache.sshd.client.channel.ClientChannelEvent
import org.apache.sshd.client.session.ClientSession
import org.apache.sshd.common.Factory
import org.apache.sshd.common.config.keys.FilePasswordProvider
import org.apache.sshd.common.config.keys.loader.openssh.OpenSSHKeyPairResourceParser
import org.apache.sshd.common.io.nio2.Nio2ServiceFactoryFactory
import org.apache.sshd.common.session.SessionContext
import org.apache.sshd.common.util.io.resource.AbstractIoResource
import org.apache.sshd.common.util.threads.CloseableExecutorService
import org.apache.sshd.sftp.client.SftpClientFactory
import org.bouncycastle.asn1.pkcs.PrivateKeyInfo
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.openssl.PEMKeyPair
import org.bouncycastle.openssl.PEMParser
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter
import org.slf4j.LoggerFactory
import java.io.*
import java.nio.charset.StandardCharsets
import java.security.KeyFactory
import java.security.KeyPair
import java.security.Security
import java.security.interfaces.RSAPrivateCrtKey
import java.security.spec.RSAPublicKeySpec
import java.time.Duration
import java.util.*
import java.util.concurrent.TimeUnit


open class SshRuntimeNode() : CloseableRuntimeNode, AbstractShellRuntimeNode() {

    private val logger = LoggerFactory.getLogger(javaClass)

    open lateinit var nodeConfig: SshRuntimeNodeConfig

    open lateinit var executorServiceFactory: Factory<CloseableExecutorService>

    class InMemoryIOResource(keyPairs: String) : AbstractIoResource<String>(String::class.java, keyPairs) {

        override fun openInputStream(): InputStream? {
            return ByteArrayInputStream(resourceValue.toByteArray(StandardCharsets.UTF_8))
        }

    }

    companion object {
        init {
            Security.addProvider(BouncyCastleProvider())
        }

        private fun loadOpenSshKey(privateKeyPem: String, secretKeyPassword: String?, session: SessionContext): KeyPair {
            try {
                ByteArrayInputStream(privateKeyPem.toByteArray(StandardCharsets.UTF_8)).use { bis ->
                    val kps = OpenSSHKeyPairResourceParser.INSTANCE.loadKeyPairs(
                        session,
                        InMemoryIOResource(privateKeyPem),
                        if (secretKeyPassword == null) { FilePasswordProvider.of(secretKeyPassword) } else { FilePasswordProvider.EMPTY }
                    )
                    val it = kps.iterator()
                    if (it.hasNext()) {
                        return it.next()
                    } else {
                        throw BusinessException("无法解析 OpenSSH 私钥")
                    }
                }
            } catch (ex: Exception) {
                throw BusinessException("解析 OpenSSH 私钥失败: ${ex.message}")
            }

        }

        private fun loadRsaKey(privateKeyPem: String): KeyPair  {
            val converter = JcaPEMKeyConverter().setProvider("BC")

            StringReader(privateKeyPem).use { sr ->
                PEMParser(sr).use { pr ->
                    val obj = pr.readObject()
                    when (obj) {
                        is PEMKeyPair -> {
                            return converter.getKeyPair(obj)
                        }
                        is PrivateKeyInfo -> {
                            val privateKey = converter.getPrivateKey(obj)
                            // 尝试从私钥推导常见类型的公钥（目前支持 RSA）
                            if (privateKey is RSAPrivateCrtKey) {
                                val kf = KeyFactory.getInstance("RSA")
                                val pubSpec = RSAPublicKeySpec(privateKey.modulus, privateKey.publicExponent)
                                val publicKey = kf.generatePublic(pubSpec)
                                return KeyPair(publicKey, privateKey)
                            }
                            throw BusinessException("无法从私钥推导出公钥，请提供公钥")
                        }
                        else -> throw BusinessException("不支持的 PEM 对象: ${obj?.javaClass?.name}")
                    }
                }
            }
        }


        fun loadKeyPairAllowEmptyPublic(privateKeyPem: String, secretKeyPassword: String?, session: SessionContext): KeyPair {
            if (privateKeyPem.startsWith("-----BEGIN OPENSSH PRIVATE KEY-----")) {
                return loadOpenSshKey(privateKeyPem, secretKeyPassword, session)
            }
            return loadRsaKey(privateKeyPem)
        }

    }

    private val session: ClientSession by lazy {
        val client = SshClient
            .setUpDefaultClient()

        client.ioServiceFactoryFactory = Nio2ServiceFactoryFactory(executorServiceFactory)
        client.start()
        val session = client.connect(nodeConfig.username, nodeConfig.host, nodeConfig.port)
            .verify(10, TimeUnit.SECONDS)
            .session
        nodeConfig.principal?.let {
            if (it.loginType == SshRuntimeNodeConfig.LoginType.KEY) {
                session.addPublicKeyIdentity(
                    loadKeyPairAllowEmptyPublic(
                        it.secretKey ?: throw BusinessException("未配置私钥"), it.secretKeyPassword,
                        session
                    )
                )
            } else if (it.loginType == SshRuntimeNodeConfig.LoginType.PASSWORD) {
                session.addPasswordIdentity(it.password)
            }
        }
        session.auth().verify(10, TimeUnit.SECONDS)
        logger.info("Successfully connected to {}", nodeConfig.host)
        session
    }


    override fun execute(command: String): CommandExecuteResult {
        session.createExecChannel(command).use { exec ->
            val outputStream = ByteArrayOutputStream(1024)
            exec.isRedirectErrorStream = true
            exec.out = outputStream
            val future = exec.open()
            while (!future.await(2, TimeUnit.SECONDS)) {
                if (Thread.currentThread().isInterrupted) {
                    throw InterruptedException()
                }
            }
            while (true) {
                val events = exec.waitFor(EnumSet.of(ClientChannelEvent.CLOSED), Duration.ofSeconds(1))
                if (events.contains(ClientChannelEvent.CLOSED)) {
                    break
                }
                if (Thread.currentThread().isInterrupted) {
                    throw InterruptedException()
                }
            }
            return CommandExecuteResult(outputStream.toString(StandardCharsets.UTF_8), exec.exitStatus ?: 255)
        }
    }

    fun grep(search: String, vararg commands: String): CommandExecuteResult {
        return execute("sh -c '${commands.joinToString(" ")} | grep ${search}'")
    }


    private class SshInteractiveShell(
        private val channel: ChannelExec,
        private val actualIn: InputStream,
        private val actualOut: OutputStream
    ) : InteractiveShell {

        private val myWriter: Writer by lazy {
            OutputStreamWriter(actualOut)
        }

        override fun getInputStream(): InputStream {
            return actualIn
        }

        override fun getWriter(): Writer {
            return myWriter
        }

        override fun getOutputStream(): OutputStream {
            return actualOut
        }


        override fun isAlive(): Boolean {
            return !channel.isClosed
        }

        override fun exitCode(): Int? {
            return channel.exitStatus
        }

        override fun close() {
            if (channel.isClosed) {
                return
            }
            channel.close(true).await()
            actualIn.close()
        }

    }

    override fun createInteractiveShell(command: String): InteractiveShell {
        val channel = session.createExecChannel(command)
        val inputStream = PipedInputStream()
        val outputStream = PipedOutputStream(inputStream)
        channel.out = outputStream

        channel.isRedirectErrorStream = true

        val future = channel.open()
        while (!future.await(1, TimeUnit.SECONDS)) {
            if (Thread.currentThread().isInterrupted) {
                throw InterruptedException()
            }
        }
        return SshInteractiveShell(channel, inputStream, channel.invertedIn)
    }


    override fun isAlive(): Boolean {
        return !session.isClosed
    }

    override fun close(): Int {
        session.close()
        return 0
    }


    override fun doUpload(src: File, dest: String) {
        logger.info("Uploading $src to $dest")
        SftpClientFactory.instance().createSftpClient(session).use { client ->
            client.put(src.toPath(), dest)
        }
    }


    override fun ensureAttachEnvironmentReady() {
        if (nodeConfig.spectreHome.isEmpty()) {
            throw BusinessException("error.spectre.home.not.empty")
        }
        if (isDirectoryExist(nodeConfig.spectreHome)) {
            if (execute("test -r ${nodeConfig.spectreHome}").isFailed()) {
                throw BusinessException("error.require.read.permission", arrayOf(nodeConfig.spectreHome))
            }
            if (execute("test -w ${nodeConfig.spectreHome}").isFailed()) {
                throw BusinessException("error.require.write.permission", arrayOf(nodeConfig.spectreHome))
            }
            if (execute("test -x ${nodeConfig.spectreHome}").isFailed()) {
                throw BusinessException("error.require.execute.permission", arrayOf(nodeConfig.spectreHome))
            }
        } else {
            mkdirs(nodeConfig.spectreHome)
        }
        nodeConfig.local ?.let {
            checkLocalConf(it)
        }
        nodeConfig.docker ?.let {
            checkDockerConf(it)
        }
    }

    private fun checkDockerConf(docker: SshRuntimeNodeConfig.Docker) {
        if (!docker.enabled) {
            return
        }
        val result = execute("${docker.executablePath} version")
        if (result.isFailed()) {
            if (result.stdout.contains("permission denied")) {
                throw BusinessException("error.require.docker.permission")
            } else {
                throw BusinessException(result.stdout)
            }
        }
    }

    private fun checkLocalConf(local: SshRuntimeNodeConfig.Local) {
        if (!local.enabled) {
            return
        }
        val javaHome = local.javaHome
        if (javaHome.isNullOrEmpty()) {
            if (execute("java", "-version").isFailed()) {
                throw BusinessException("error.java.not.found")
            }
        } else {
            val execute = execute("${javaHome}/bin/java", "-version")
            if (execute.isFailed()) {
                throw BusinessException("error.java.not.found.in.home", arrayOf(javaHome, execute.stdout))
            }
        }
    }

    override fun getConfiguration(): SshRuntimeNodeConfig {
        return nodeConfig
    }
}