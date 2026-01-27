package io.github.vudsen.spectre.common

import java.security.SecureRandom

object SecureRandomFactory {

    val secureRandom = SecureRandom()

    private const val CHAR_POOL = "0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHIJKMNOPQRSTUVWXYZ"

    fun randomString(len: Int): String {
        return buildString {
            for (i in 0 until len) {
                val p = secureRandom.nextInt(CHAR_POOL.length)
                append(CHAR_POOL[p])
            }
        }
    }

}