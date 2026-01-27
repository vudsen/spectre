package io.github.vudsen.spectre.api.plugin.policy

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.perm.PolicyPermissionContext

/**
 * 基础的 ABAC 鉴权。
 *
 * 1. 首先系统会调用 [toContextMap] 将上下文转换为 Map
 * 2. 执行 [io.github.vudsen.spectre.api.dto.PolicyPermissionDTO.conditionExpression] 表达式判断是否有权限
 * 3. 如果权限有增强的代码(see [io.github.vudsen.spectre.api.plugin.EnhancePolicyAuthenticationExtensionPoint])，则依次执行增强代码
 * 4. 最后，如果用户权限不足，则尝试调用 [customiseErrorException] 来创建对应错误信息，如果没有则返回默认错误。该步骤不一定会触发，增强逻辑中可能会直接抛出异常，
 * 但如果没有增强逻辑，是一定会调用的
 */
interface PolicyAuthenticationProvider {


    /**
     * 将上下文转换成 Map.
     */
    fun toContextMap(ctx: PolicyPermissionContext): MutableMap<String, Any>

    /**
     * 获取策略权限
     */
    fun getPermissionEntity(): PermissionEntity

    /**
     * 创建一个用于指导配置的上下文
     */
    fun createExampleContext(): List<PolicyPermissionContextExample>

    /**
     * 当用户权限不足时，自定义返回的错误.
     *
     * @return 自定义错误，如果返回空，则会使用系统默认实现
     */
    fun customiseErrorException(): BusinessException?

}