package io.github.vudsen.spectre.common

import io.github.vudsen.spectre.api.entity.OS
import io.github.vudsen.spectre.api.entity.currentOS
import org.slf4j.LoggerFactory

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
    val ENCRYPTOR_KEY: String?

    /**
     * 加密器的 salt
     */
    val ENCRYPTOR_SALT: String?

    init {
        var home = System.getenv("SPECTRE_HOME")
        val logger = LoggerFactory.getLogger(SpectreEnvironment::class.java)
        if (home == null) {
            home = if (currentOS == OS.LINUX) {
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
        ENCRYPTOR_KEY = System.getenv("ENCRYPTOR_KEY")
        ENCRYPTOR_SALT = System.getenv("ENCRYPTOR_SALT")
        GRAPHQL_AUTHORIZATION_TOKEN = System.getenv("GRAPHQL_AUTHORIZATION_TOKEN")
        PREVIEW_ENVIRONMENT = System.getenv("PREVIEW_ENVIRONMENT") == "true"
    }


}