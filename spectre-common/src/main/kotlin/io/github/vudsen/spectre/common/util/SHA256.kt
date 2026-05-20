package io.github.vudsen.spectre.common.util

import io.github.vudsen.spectre.common.SpectreEnvironment
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

private const val HMAC_SHA_256 = "HmacSHA256"
private val defaultHashKey = "hM0,vR4_vV5^rZ2<gL1\$oL3`hD0:gH9~".toByteArray()

fun String.toSha256(): String {
    val mac: Mac = Mac.getInstance(HMAC_SHA_256)
    val keySpec =
        SecretKeySpec(
            SpectreEnvironment.ENCRYPTOR_KEY ?: defaultHashKey,
            HMAC_SHA_256,
        )
    mac.init(keySpec)

    val result: ByteArray? = mac.doFinal(toByteArray())
    return Base64.getUrlEncoder().withoutPadding().encodeToString(result)
}
