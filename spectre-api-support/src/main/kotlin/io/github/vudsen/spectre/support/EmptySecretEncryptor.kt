package io.github.vudsen.spectre.support

import io.github.vudsen.spectre.api.plugin.SecretEncryptor

class EmptySecretEncryptor : SecretEncryptor {
    override fun getTag(): String = "RAW"

    override fun encrypt(
        raw: String,
        salt: ByteArray,
    ): String = raw

    override fun decrypt(
        encoded: String,
        salt: ByteArray,
        startIndex: Int,
        endIndex: Int,
    ): String = encoded.substring(startIndex, endIndex)
}
