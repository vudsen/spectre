package io.github.vudsen.spectre.common

import io.github.vudsen.spectre.api.entity.OS
import io.github.vudsen.spectre.api.entity.currentOS
import org.slf4j.LoggerFactory

object SpectreEnvironment {

    val SPECTRE_HOME: String

    /**
     * graphql 请求 schema 的 token
     */
    val GRAPHQL_AUTHORIZATION_TOKEN: String?

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
        GRAPHQL_AUTHORIZATION_TOKEN = System.getenv("GRAPHQL_AUTHORIZATION_TOKEN")
    }


}