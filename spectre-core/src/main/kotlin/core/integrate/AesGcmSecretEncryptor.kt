package io.github.vudsen.spectre.core.integrate

import io.github.vudsen.spectre.api.plugin.SecretEncryptor
import io.github.vudsen.spectre.common.SecureRandomFactory
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import kotlin.io.encoding.Base64

class AesGcmSecretEncryptor(key: String, salt: String) : SecretEncryptor {

    private val key = deriveAesKeyFromPassword(key, salt)

    companion object {
        private const val ALGORITHM = "AES"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val IV_LENGTH = 12            // 96 bit, GCM 标准
        private const val TAG_LENGTH_BIT = 128       // 认证标签长度

        fun deriveAesKeyFromPassword(
            base64Password: String,
            salt: String,
            iterations: Int = 100_000,
            keySize: Int = 64
        ): SecretKey {
            val password = Base64.decode(base64Password)

            val spec = PBEKeySpec(
                password.toString(Charsets.UTF_8).toCharArray(),
                Base64.decode(salt),
                iterations,
                keySize
            )

            val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            val keyBytes = factory.generateSecret(spec).encoded

            return SecretKeySpec(keyBytes, ALGORITHM)
        }

    }



    override fun encrypt(raw: String, salt: String): String {
        val iv = ByteArray(IV_LENGTH)
        SecureRandomFactory.secureRandom.nextBytes(iv)

        val cipher = Cipher.getInstance(TRANSFORMATION)
        val spec = GCMParameterSpec(TAG_LENGTH_BIT, iv)
        cipher.init(Cipher.ENCRYPT_MODE, key, spec)

        cipher.updateAAD(salt.toByteArray())

        val cipherText = cipher.doFinal(raw.toByteArray())

        // 拼接 iv + cipherText，一起 Base64
        val result = ByteArray(iv.size + cipherText.size)
        System.arraycopy(iv, 0, result, 0, iv.size)
        System.arraycopy(cipherText, 0, result, iv.size, cipherText.size)

        return Base64.encode(result)
    }

    override fun decrypt(encoded: String, salt: String): String {
        val encrypted = Base64.decode(encoded)

        val iv = encrypted.copyOfRange(0, IV_LENGTH)
        val cipherText = encrypted.copyOfRange(IV_LENGTH, encrypted.size)

        val cipher = Cipher.getInstance(TRANSFORMATION)
        val spec = GCMParameterSpec(TAG_LENGTH_BIT, iv)
        cipher.init(Cipher.DECRYPT_MODE, key, spec)

        cipher.updateAAD(salt.toByteArray())

        // 如果数据被篡改，这里会直接抛 AEADBadTagException
        return String(cipher.doFinal(cipherText))
    }
}