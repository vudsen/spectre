package io.github.vudsen.spectre.core.plugin.ssh

import com.fasterxml.jackson.annotation.JsonIgnore
import io.github.vudsen.spectre.common.RuntimeNodeConfig
import io.github.vudsen.spectre.common.secure.Encrypted

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

    data class Docker(
        var enabled: Boolean,
        var executablePath: String,
        var javaHome: String?,
        var spectreHome: String?,
    ) {
        constructor() : this(false, "docker", null, "/opt/spectre")
    }

    data class Local(
        var enabled: Boolean,
        var javaHome: String?
    ) {
        constructor() : this(false, null)
    }

    enum class LoginType {
        PASSWORD,
        KEY,
        NONE
    }

    data class LoginPrincipal(
        var loginType: LoginType,
        @Encrypted
        var password: String?,
        @Encrypted
        var secretKey: String?,
        @Encrypted
        var secretKeyPassword: String?,
    ) {
        constructor() : this(LoginType.NONE, null, null, null)
    }



}