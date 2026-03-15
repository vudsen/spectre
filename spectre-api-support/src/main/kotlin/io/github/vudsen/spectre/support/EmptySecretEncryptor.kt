package io.github.vudsen.spectre.support

import io.github.vudsen.spectre.api.plugin.SecretEncryptor

class EmptySecretEncryptor : SecretEncryptor {

    override fun getTag(): String {
        return "RAW"
    }

    override fun encrypt(raw: String, salt: String): String {
        return raw
    }

    override fun decrypt(encoded: String, salt: String, startIndex: Int, endIndex: Int): String {
        return encoded.substring(startIndex, endIndex)
    }
}