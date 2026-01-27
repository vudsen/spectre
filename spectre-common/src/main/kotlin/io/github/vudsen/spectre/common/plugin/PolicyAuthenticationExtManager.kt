package io.github.vudsen.spectre.common.plugin

import io.github.vudsen.spectre.api.plugin.EnhancePolicyAuthenticationExtensionPoint
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.perm.PermissionEntity

class PolicyAuthenticationExtManager(extensions: List<EnhancePolicyAuthenticationExtensionPoint>) {


    private val policyAuthenticationExtensions: Map<PermissionEntity, List<EnhancePolicyAuthenticationExtensionPoint>>

    private val idMap: Map<String, EnhancePolicyAuthenticationExtensionPoint>

    init {
        val map = mutableMapOf<PermissionEntity, MutableList<EnhancePolicyAuthenticationExtensionPoint>>()
        val idMap = mutableMapOf<String, EnhancePolicyAuthenticationExtensionPoint>()
        for (point in extensions) {
            idMap.put(point.getId(), point) ?.let {
                throw IllegalStateException("Duplicate plugin id '${point.getId()}'")
            }
            map.compute(point.getEnhanceTarget()) { k, v ->
                val result = v ?: mutableListOf()
                result.add(point)
                return@compute result
            }
        }
        this.idMap = idMap
        policyAuthenticationExtensions = map
    }

    fun getById(id: String): EnhancePolicyAuthenticationExtensionPoint {
        return idMap[id] ?: throw AppException("插件不存在，id: ${id}")
    }

    fun getExtPoints(permissionEntity: PermissionEntity): List<EnhancePolicyAuthenticationExtensionPoint> {
        return policyAuthenticationExtensions[permissionEntity] ?: emptyList()
    }


}