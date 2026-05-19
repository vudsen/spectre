package io.github.vudsen.spectre.repo.convert

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator
import io.github.vudsen.spectre.common.Jvm
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter
class ArthasInstanceJvmConverter : AttributeConverter<Jvm, String> {
    companion object {
        val objectMapper: ObjectMapper =
            JsonMapper
                .builder()
                .activateDefaultTyping(
                    BasicPolymorphicTypeValidator
                        .builder()
                        .allowIfSubType(Jvm::class.java)
                        .build(),
                    ObjectMapper.DefaultTyping.NON_FINAL,
                    JsonTypeInfo.As.PROPERTY,
                ).build()
    }

    override fun convertToDatabaseColumn(attribute: Jvm): String = objectMapper.writerFor(Any::class.java).writeValueAsString(attribute)

    override fun convertToEntityAttribute(dbData: String): Jvm = objectMapper.readValue(dbData, Jvm::class.java)
}
