package io.github.vudsen.spectre.support.secure

import io.github.vudsen.spectre.api.SecretEncryptorManager
import io.github.vudsen.spectre.api.exception.AppException
import io.github.vudsen.spectre.common.ApplicationContextHolder
import io.github.vudsen.spectre.common.secure.Encrypted
import tools.jackson.core.JsonGenerator
import tools.jackson.core.JsonParser
import tools.jackson.databind.BeanDescription
import tools.jackson.databind.DeserializationConfig
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.SerializationConfig
import tools.jackson.databind.SerializationContext
import tools.jackson.databind.ValueDeserializer
import tools.jackson.databind.ValueSerializer
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.deser.BeanDeserializerBuilder
import tools.jackson.databind.deser.SettableBeanProperty
import tools.jackson.databind.deser.ValueDeserializerModifier
import tools.jackson.databind.module.SimpleModule
import tools.jackson.databind.ser.BeanPropertyWriter
import tools.jackson.databind.ser.ValueSerializerModifier

/**
 * 对接 [Encrypted] 注解，支持自动加解密
 */
object SecretSupportedObjectMapper {

    private fun secretEncryptorManager(): SecretEncryptorManager {
        return ApplicationContextHolder.applicationContext.getBean(SecretEncryptorManager::class.java)
    }

    private fun isEncrypted(propertyWriter: BeanPropertyWriter): Boolean {
        return propertyWriter.getAnnotation(Encrypted::class.java) != null
            || propertyWriter.member?.hasAnnotation(Encrypted::class.java) == true
    }

    private fun isEncrypted(property: SettableBeanProperty): Boolean {
        return property.getAnnotation(Encrypted::class.java) != null
            || property.member?.hasAnnotation(Encrypted::class.java) == true
    }

    private object EncryptedSerializer : ValueSerializer<Any>() {

        override fun serialize(value: Any?, gen: JsonGenerator, ctxt: SerializationContext?) {
            if (value is String) {
                gen.writeString(secretEncryptorManager().encrypt(value))
                return
            }
            throw AppException("Encrypt value type must be a String")
        }

    }

    private object EncryptedDeserializer : ValueDeserializer<String>() {

        override fun deserialize(p: JsonParser, ctxt: DeserializationContext): String? {
//            val value = p.string ?: return null
            val string = p.readValueAs(String::class.java) ?: return null
            return secretEncryptorManager().decrypt(string)
        }
    }

    val instance: JsonMapper = JsonMapper.builderWithJackson2Defaults()
        .addModule(SimpleModule().apply {
            setSerializerModifier(object : ValueSerializerModifier() {

                override fun changeProperties(
                    config: SerializationConfig,
                    beanDesc: BeanDescription.Supplier,
                    beanProperties: List<BeanPropertyWriter>
                ): List<BeanPropertyWriter> {
                    beanProperties.forEach { property ->
                        if (isEncrypted(property)) {
                            property.assignSerializer(EncryptedSerializer)
                        }
                    }
                    return beanProperties
                }
            })

            setDeserializerModifier(object : ValueDeserializerModifier() {

                override fun updateBuilder(
                    config: DeserializationConfig,
                    beanDescRef: BeanDescription.Supplier,
                    builder: BeanDeserializerBuilder
                ): BeanDeserializerBuilder {
                    val replaced = ArrayList<SettableBeanProperty>()
                    val properties = builder.properties
                    while (properties.hasNext()) {
                        val property = properties.next()
                        if (!isEncrypted(property)) {
                            continue
                        }
                        replaced.add(property.withValueDeserializer(EncryptedDeserializer))
                    }

                    replaced.forEach {
                        builder.addOrReplaceProperty(it, true)
                    }
                    return builder
                }

            })
        }).build()


}
