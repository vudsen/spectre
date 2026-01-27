package io.github.vudsen.spectre.common

import io.github.vudsen.spectre.api.plugin.SecretEncryptor

class EmptySecretEncryptor : SecretEncryptor {
    override fun encrypt(raw: String, salt: String): String {
        return raw
    }

    override fun decrypt(encoded: String, salt: String): String {
        return encoded
    }
}