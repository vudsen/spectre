package io.github.vudsen.spectre.core.plugin.ssh

import io.github.vudsen.spectre.api.plugin.rnode.RuntimeNodeConfig

data class SshRuntimeNodeConfig(
    var docker: Docker?,
    var local: Local?,
    var host: String,
    var port: Int,
    var username: String,
    var principal: LoginPrincipal?,
    var spectreHome: String,
) : RuntimeNodeConfig {

    constructor() : this(null, null, "", 22, "", null, "/opt/spectre")

    class Docker(
        var enabled: Boolean = false,
        var executablePath: String? = null,
        var javaHome: String? = null,
        var spectreHome: String? = "/opt/spectre",
    )

    class Local(
        var enabled: Boolean = false,
        var javaHome: String = ""
    )

    enum class LoginType {
        PASSWORD,
        KEY,
        NONE
    }

    class LoginPrincipal(
        var loginType: LoginType = LoginType.NONE,
        var password: String? = null,
        var secretKey: String? = null,
        var secretKeyPassword: String? = null,
    )



}