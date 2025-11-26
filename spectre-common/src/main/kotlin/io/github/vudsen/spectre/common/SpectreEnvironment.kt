package io.github.vudsen.spectre.common

import io.github.vudsen.spectre.api.entity.OS
import io.github.vudsen.spectre.api.entity.currentOS

object SpectreEnvironment {

    val SPECTRE_HOME: String

    /**
     * graphql 请求 schema 的 token
     */
    val GRAPHQL_AUTHORIZATION_TOKEN: String?

    init {
        var home = System.getenv("SPECTRE_HOME")
        if (home == null) {
            if (currentOS == OS.LINUX) {
                home = "/opt/spectre"
            } else {
                val userHome = System.getProperty("user.home")
                if (currentOS == OS.WINDOWS) {
                    home = "$userHome\\AppData\\Local\\spectre"
                } else {
                    // mac
                    home = "$userHome/Library/Application Support/spectre"
                }
            }
        }
        SPECTRE_HOME = home
        GRAPHQL_AUTHORIZATION_TOKEN = System.getenv("GRAPHQL_AUTHORIZATION_TOKEN")
    }


}