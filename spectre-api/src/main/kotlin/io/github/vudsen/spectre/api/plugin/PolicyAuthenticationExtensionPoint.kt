package io.github.vudsen.spectre.api.plugin

import io.github.vudsen.spectre.api.entity.TypedPageDescriptor
import io.github.vudsen.spectre.api.perm.PermissionEntity

/**
 * 策略权限增强扩展。
 *
 * 该扩展允许策略权限添加自己的表单以提供更加具体的权限控制。
 *
 * 在扩展会在 `SpEL` 表达式执行完后再调用 [hasPermission] 来进行增强鉴权。
 */
abstract class PolicyAuthenticationExtensionPoint : ExtensionPoint {

    class EnhancePageParameterVO(var pluginId: String)

    /**
     * 获取该扩展要增强的目标
     */
    abstract fun getEnhanceTarget(): PermissionEntity

    /**
     * 获取配置页面
     */
    abstract fun getConfigurationPage(): TypedPageDescriptor<EnhancePageParameterVO>

    /**
     * 检查是否拥有权限
     * @param context 上下文
     * @param conf [getConfigurationClass] 对应的配置
     * @return 是否拥有对应权限。实现类也可以自己直接抛出异常来覆盖默认的错误信息
     */
    abstract fun hasPermission(context: Map<String, Any>, conf: Any): Boolean

    /**
     * 获取配置类
     */
    abstract fun getConfigurationClass(): Class<*>

}