package io.github.vudsen.spectre.api.exception

/**
 * 当抛出该异常时，表示需要配合开发人员进行处理(用户看不懂)
 */
open class AppException(msg: String) : RuntimeException(msg) {
}