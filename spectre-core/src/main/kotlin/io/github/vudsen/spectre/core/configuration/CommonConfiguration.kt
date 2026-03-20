package io.github.vudsen.spectre.core.configuration

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.support.ResourceBundleMessageSource
import tools.jackson.core.JsonParser
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.ValueDeserializer
import tools.jackson.databind.module.SimpleModule
import tools.jackson.databind.ser.std.ToStringSerializer
import java.util.Locale

@Configuration
class CommonConfiguration {
    @Bean
    fun longToStringModule(): SimpleModule {
        val module = SimpleModule("LongToStringModule")

        // 1. Long -> String (使用新的包名和 instance)
        module.addSerializer(Long::class.java, ToStringSerializer.instance)
        module.addSerializer(java.lang.Long.TYPE, ToStringSerializer.instance)

        // 2. String -> Long (注意：不再强制声明 throws IOException)
        module.addDeserializer(
            Long::class.java,
            object : ValueDeserializer<Long?>() {
                override fun deserialize(
                    p: JsonParser,
                    ctxt: DeserializationContext,
                ): Long? {
                    val value = p.valueAsString
                    return if (value.isNullOrBlank()) null else value.toLong()
                }
            },
        )

        module.addDeserializer(
            java.lang.Long.TYPE,
            object : ValueDeserializer<Long>() {
                override fun deserialize(
                    p: JsonParser,
                    ctxt: DeserializationContext,
                ): Long {
                    val value = p.valueAsString
                    return if (value.isNullOrBlank()) 0L else value.toLong()
                }
            },
        )

        return module
    }

    // 这里的配置文件 也可以写在 application.yml 中
    @Bean
    fun messageSource(): ResourceBundleMessageSource {
        Locale.setDefault(Locale.SIMPLIFIED_CHINESE)
        val source = ResourceBundleMessageSource()
        // 设置国际化文件存储路径和名称
        // i18n目录，messages文件名
        // Spring Boot 会根据不同的语言环境自动加载对应的资源文件，
        // 例如 messages_zh_CN.properties 或 messages_en_US.properties
        source.setBasenames("i18n/log", "i18n/error", "i18n/skill")
        // 设置根据key如果没有获取到对应的文本信息,则返回key作为信息
        source.setUseCodeAsDefaultMessage(true)
        // 设置字符编码
        source.setDefaultEncoding("UTF-8")
        return source
    }
}
