package io.github.vudsen.spectre.core.util

import javax.net.ssl.HostnameVerifier
import javax.net.ssl.SSLSession

object TrustAnyHostnameVerifier : HostnameVerifier {
    override fun verify(hostname: String?, session: SSLSession?): Boolean {
        return true
    }
}