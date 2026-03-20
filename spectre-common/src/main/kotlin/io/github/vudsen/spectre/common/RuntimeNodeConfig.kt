package io.github.vudsen.spectre.common

/**
 * 运行节点配置.
 *
 * 如果配置需要加密，应该对其添加 [io.github.vudsen.spectre.common.secure.Encrypted] 注解，在保存到数据库时将会自动加密。
 *
 */
interface RuntimeNodeConfig {
    override fun equals(other: Any?): Boolean

    override fun hashCode(): Int
}
