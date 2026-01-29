package io.github.vudsen.spectre.api.plugin

interface SecretEncryptor {

    /**
     * 对密码加密
     * @return base64 编码后的密文
      */
    fun encrypt(raw: String, salt: String): String

    /**
     * 解密
     */
    fun decrypt(encoded: String, salt: String): String

}