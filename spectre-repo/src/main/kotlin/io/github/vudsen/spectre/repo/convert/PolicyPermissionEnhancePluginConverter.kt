package io.github.vudsen.spectre.repo.convert

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.repo.entity.PolicyPermissionEnhancePlugin
import jakarta.persistence.AttributeConverter

class PolicyPermissionEnhancePluginConverter : AttributeConverter<List<PolicyPermissionEnhancePlugin>, String> {


    private val objectMapper = ObjectMapper()

    override fun convertToDatabaseColumn(attribute: List<PolicyPermissionEnhancePlugin>?): String? {
        attribute ?: return null
        return objectMapper.writeValueAsString(attribute)
    }

    override fun convertToEntityAttribute(dbData: String?): List<PolicyPermissionEnhancePlugin> {
        dbData ?: return emptyList()
        return objectMapper.readValue(dbData, MyTypeReference)
    }

    private object MyTypeReference : TypeReference<List<PolicyPermissionEnhancePlugin>>(){}
}