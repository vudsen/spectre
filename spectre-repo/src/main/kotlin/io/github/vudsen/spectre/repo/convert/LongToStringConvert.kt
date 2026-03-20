package io.github.vudsen.spectre.repo.convert

import jakarta.persistence.AttributeConverter

class LongToStringConvert : AttributeConverter<String, Long> {
    override fun convertToDatabaseColumn(attribute: String?): Long? = attribute?.toLong()

    override fun convertToEntityAttribute(dbData: Long?): String? = dbData?.toString()
}
