package io.github.vudsen.spectre.common

import io.github.vudsen.spectre.common.util.OS
import io.github.vudsen.spectre.common.util.currentOS
import org.slf4j.LoggerFactory
import java.util.Base64

object SpectreEnvironment {
    val SPECTRE_HOME: String

    /**
     * 是否为当前公开的预览环境
     */
    val PREVIEW_ENVIRONMENT: Boolean

    /**
     * graphql 请求 schema 的 token
     */
    val GRAPHQL_AUTHORIZATION_TOKEN: String?

    /**
     * 加密器的 key
     */
    val ENCRYPTOR_KEY: ByteArray?

    /**
     * 加密器的 salt
     */
    val ENCRYPTOR_SALT: ByteArray?

    init {
        var home = System.getenv("SPECTRE_HOME")
        val logger = LoggerFactory.getLogger(SpectreEnvironment::class.java)
        if (home == null) {
            home =
                if (currentOS == OS.LINUX) {
                    "/opt/spectre"
                } else {
                    val userHome = System.getProperty("user.home")
                    if (currentOS == OS.WINDOWS) {
                        "$userHome\\AppData\\Local\\spectre"
                    } else {
                        // mac
                        "$userHome/Library/Application Support/spectre"
                    }
                }
            logger.warn("SPECTRE_HOME is not specific, will use the default path: {}", home)
        }
        SPECTRE_HOME = home
        ENCRYPTOR_KEY =
            System.getenv("ENCRYPTOR_KEY")?.let {
                Base64.getDecoder().decode(it)
            }
        ENCRYPTOR_SALT =
            System.getenv("ENCRYPTOR_SALT")?.let {
                Base64.getDecoder().decode(it)
            }
        if (ENCRYPTOR_KEY == null) {
            logger.warn("ENCRYPTOR_KEY is not specific, sensitive fields will be stored in plaintext.")
        } else if (ENCRYPTOR_SALT == null) {
            logger.warn("ENCRYPTOR_SALT is not specific, providing this environment variable is recommended for better security.")
        }
        GRAPHQL_AUTHORIZATION_TOKEN = System.getenv("GRAPHQL_AUTHORIZATION_TOKEN")
        PREVIEW_ENVIRONMENT = System.getenv("PREVIEW_ENVIRONMENT") == "true"
    }
}
