package io.github.vudsen.spectre.api.entity

enum class OS {
    WINDOWS,
    MAC,
    LINUX,
    UNKNOWN
}

val currentOS = resolveCurrentOS()

/**
 * 获取当前操纵系统
 */
private fun resolveCurrentOS(): OS {
    val property = System.getProperty("os.name")
    if (property.startsWith("Windows")) {
        return OS.WINDOWS
    } else if (property.startsWith("Mac")) {
        return OS.MAC
    } else if (property.startsWith("Linux")) {
        return OS.LINUX
    }
    throw IllegalArgumentException("Unknown OS: $property")
}