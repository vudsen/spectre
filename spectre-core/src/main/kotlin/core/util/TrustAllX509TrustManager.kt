package io.github.vudsen.spectre.core.util

import java.security.cert.X509Certificate
import javax.net.ssl.X509TrustManager

object TrustAllX509TrustManager : X509TrustManager {
    override fun checkClientTrusted(
        chain: Array<out X509Certificate?>?,
        authType: String?
    ) {
        // Do nothing
    }

    override fun checkServerTrusted(
        chain: Array<out X509Certificate?>?,
        authType: String?
    ) {
        // Do nothing
    }

    override fun getAcceptedIssuers(): Array<out X509Certificate?>? {
        return emptyArray()
    }
}