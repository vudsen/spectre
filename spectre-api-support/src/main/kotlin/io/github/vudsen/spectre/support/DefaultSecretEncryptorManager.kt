package io.github.vudsen.spectre.support

import io.github.vudsen.spectre.api.SecretEncryptorManager
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.plugin.SecretEncryptor
import io.github.vudsen.spectre.common.SpectreEnvironment
import org.springframework.cache.Cache

class DefaultSecretEncryptorManager(
    encryptors: List<SecretEncryptor>,
    private val defaultEncryptor: SecretEncryptor,
    private val cache: Cache,
) : SecretEncryptorManager {
    private val encryptorMap: Map<String, SecretEncryptor> =
        buildMap {
            for (encryptor in encryptors) {
                put(encryptor.getTag(), encryptor)
            }
        }

    companion object {
        private val DEFAULT_ENCRYPTION_SALT = "uG3vD5zN2hC3kA2k".toByteArray()
    }

    private fun findTag(raw: String): String? {
        if (raw.isBlank()) return null
        if (raw[0] != '{') {
            return null
        }
        val i = raw.indexOf('}', 1)
        if (i < 0) {
            return null
        }
        return raw.substring(1, i)
    }

    override fun encrypt(
        raw: String,
        salt: ByteArray?,
    ): String {
        if (raw.isBlank()) {
            return ""
        }
        return "{${defaultEncryptor.getTag()}}${defaultEncryptor.encrypt(
            raw,
            salt ?: SpectreEnvironment.ENCRYPTOR_SALT ?: DEFAULT_ENCRYPTION_SALT,
        )}"
    }

    override fun decrypt(
        encoded: String,
        salt: ByteArray?,
    ): String {
        cache.get(encoded)?.let {
            return it.get() as String
        }
        val tag = findTag(encoded) ?: return encoded

        if (tag.length == encoded.length) {
            return ""
        }
        val encryptor = encryptorMap[tag] ?: throw AppException("Unknown tag: $tag")
        val decrypt =
            encryptor.decrypt(
                encoded,
                salt ?: SpectreEnvironment.ENCRYPTOR_SALT ?: DEFAULT_ENCRYPTION_SALT,
                tag.length + 2,
                encoded.length,
            )
        cache.put(tag, decrypt)
        return decrypt
    }
}
