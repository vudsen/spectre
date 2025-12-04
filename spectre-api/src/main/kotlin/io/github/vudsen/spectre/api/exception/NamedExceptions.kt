package io.github.vudsen.spectre.api.exception

enum class NamedExceptions(val msg: String, val httpCode: Int? = null) {
    /**
     * 会话过期
     */
    SESSION_EXPIRED( "当前会话过期，请刷新页面"),
    FORBIDDEN("您没有访问当前接口的权限", 403);

    fun toException(): BusinessException {
        return BusinessException(msg, emptyArray()).apply {
            httpStatus = this@NamedExceptions.httpCode
        }
    }
}