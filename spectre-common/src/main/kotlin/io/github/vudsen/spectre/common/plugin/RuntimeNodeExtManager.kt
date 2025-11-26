package io.github.vudsen.spectre.common.plugin

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.plugin.RuntimeNodeExtensionPoint

/**
 * 管理所有的扩展
 */
class RuntimeNodeExtManager(
    extPoints: List<RuntimeNodeExtensionPoint>
) {
    private val extPointMap: Map<String, RuntimeNodeExtensionPoint>

    init {
        val points = mutableMapOf<String, RuntimeNodeExtensionPoint>()
        for (point in extPoints) {
            points[point.getId()] = point
        }
        this.extPointMap = points
    }


    fun findById(extPointId: String): RuntimeNodeExtensionPoint {
        return extPointMap[extPointId] ?: throw BusinessException("插件不存在: $extPointId")
    }

    fun listPlugins(): Collection<RuntimeNodeExtensionPoint> {
        return extPointMap.values
    }

}