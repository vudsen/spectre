package io.github.vudsen.spectre.common.plugin

import io.github.vudsen.spectre.api.plugin.PolicyAuthenticationExtensionPoint
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.api.perm.PermissionEntity

class PolicyAuthenticationExtManager(extensions: List<PolicyAuthenticationExtensionPoint>) {


    private val policyAuthenticationExtensions: Map<PermissionEntity, List<PolicyAuthenticationExtensionPoint>>

    private val idMap: Map<String, PolicyAuthenticationExtensionPoint>

    init {
        val map = mutableMapOf<PermissionEntity, MutableList<PolicyAuthenticationExtensionPoint>>()
        val idMap = mutableMapOf<String, PolicyAuthenticationExtensionPoint>()
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

    fun getById(id: String): PolicyAuthenticationExtensionPoint {
        return idMap[id] ?: throw AppException("插件不存在，id: ${id}")
    }

    fun getExtPoints(permissionEntity: PermissionEntity): List<PolicyAuthenticationExtensionPoint> {
        return policyAuthenticationExtensions[permissionEntity] ?: emptyList()
    }


}