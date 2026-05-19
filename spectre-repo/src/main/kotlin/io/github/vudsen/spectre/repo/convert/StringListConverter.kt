package io.github.vudsen.spectre.repo.convert

import io.github.vudsen.spectre.common.util.GLOBAL_JSON_MAPPER
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter
class StringListConverter : AttributeConverter<List<String>, String> {
    override fun convertToDatabaseColumn(attribute: List<String>): String = GLOBAL_JSON_MAPPER.writeValueAsString(attribute)

    override fun convertToEntityAttribute(dbData: String): List<String> =
        GLOBAL_JSON_MAPPER.readerForListOf(String::class.java).readValue(dbData)
}
