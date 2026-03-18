package io.github.vudsen.spectre.api.plugin

interface SecretEncryptor {

    fun getTag(): String

    /**
     * 对密码加密
     * @return base64 编码后的密文
      */
    fun encrypt(raw: String, salt: ByteArray): String

    /**
     * 解密
     */
    fun decrypt(encoded: String, salt: ByteArray, startIndex: Int, endIndex: Int): String

}