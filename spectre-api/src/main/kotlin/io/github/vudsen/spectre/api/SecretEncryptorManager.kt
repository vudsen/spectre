package io.github.vudsen.spectre.api

/**
 * 维护系统中的所有加解密器
 */
interface SecretEncryptorManager {

    fun encrypt(raw: String, salt: String? = null): String

    fun decrypt(encoded: String, salt: String? = null): String

}