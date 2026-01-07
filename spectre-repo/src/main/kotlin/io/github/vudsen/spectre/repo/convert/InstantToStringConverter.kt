package io.github.vudsen.spectre.repo.convert

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import java.time.Instant
import java.time.format.DateTimeFormatter


@Converter(autoApply = true)
class InstantToStringConverter : AttributeConverter<Instant?, String?> {
    override fun convertToDatabaseColumn(attribute: Instant?): String? {
        return if (attribute == null)
            null
        else
            DateTimeFormatter.ISO_INSTANT.format(attribute)
    }

    override fun convertToEntityAttribute(dbData: String?): Instant? {
        return if (dbData == null)
            null
        else
            Instant.parse(dbData)
    }
}
