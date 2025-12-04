package io.github.vudsen.spectre.api.plugin.policy

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.perm.ABACContext

interface ABACAuthenticationProvider {


    /**
     * 将上下文转换成 Map.
     */
    fun toContextMap(ctx: ABACContext): MutableMap<String, Any>

    /**
     * 是否支持
     */
    fun isSupport(clazz: Class<out ABACContext>): Boolean

    /**
     * 创建一个用于测试的上下文
     */
    fun createTestContext(): ABACContext

    /**
     * 当用户权限不足时，自定义返回的错误.
     *
     * @return 自定义错误，如果返回空，则会使用系统默认实现
     */
    fun customiseErrorException(): BusinessException?

}