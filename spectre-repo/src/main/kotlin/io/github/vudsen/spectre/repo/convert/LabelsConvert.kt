package io.github.vudsen.spectre.repo.convert

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter
class LabelsConvert : AttributeConverter<Map<String, String>, String> {

    private val objectMapper = ObjectMapper()


    override fun convertToDatabaseColumn(labels: Map<String, String>?): String? {
        labels ?: return null
        return objectMapper.writeValueAsString(labels)
    }

    override fun convertToEntityAttribute(dbData: String?): Map<String, String> {
        dbData ?: return emptyMap()
        return objectMapper.readValue(dbData, object : TypeReference<Map<String, String>>() {})
    }
}