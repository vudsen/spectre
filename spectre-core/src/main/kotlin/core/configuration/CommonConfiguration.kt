package io.github.vudsen.spectre.core.configuration

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.module.SimpleModule
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.github.vudsen.spectre.core.lock.DistributedLock
import io.github.vudsen.spectre.core.lock.InMemoryDistributedLock
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.support.ResourceBundleMessageSource
import java.io.IOException
import java.util.Locale


@Configuration
class CommonConfiguration {

    @Bean
    fun longToStringModule(): com.fasterxml.jackson.databind.Module {
        val module = SimpleModule()
        // Long -> String
        module.addSerializer<Any?>(Long::class.java, ToStringSerializer.instance)
        module.addSerializer<Any?>(java.lang.Long.TYPE, ToStringSerializer.instance)
        // String -> Long
        module.addDeserializer<Long?>(Long::class.java, object : JsonDeserializer<Long?>() {
            @Throws(IOException::class)
            public override fun deserialize(p: JsonParser, ctxt: DeserializationContext?): Long? {
                val value: String? = p.getValueAsString()
                return if (value == null || value.isEmpty()) null else value.toLong()
            }
        })
        module.addDeserializer<Long?>(java.lang.Long.TYPE, object : JsonDeserializer<Long?>() {
            @Throws(IOException::class)
            public override fun deserialize(p: JsonParser, ctxt: DeserializationContext?): Long {
                val value: String? = p.getValueAsString()
                return if (value == null || value.isEmpty()) 0L else value.toLong()
            }
        })
        return module
    }


    @Bean
    fun lock(): DistributedLock {
        return InMemoryDistributedLock()
    }

    //这里的配置文件 也可以写在 application.yml 中
    @Bean
    fun messageSource(): ResourceBundleMessageSource {
        Locale.setDefault(Locale.SIMPLIFIED_CHINESE);
        val source = ResourceBundleMessageSource()
        //设置国际化文件存储路径和名称
        // i18n目录，messages文件名
        //Spring Boot 会根据不同的语言环境自动加载对应的资源文件，
        // 例如 messages_zh_CN.properties 或 messages_en_US.properties
        source.setBasenames("i18n/log", "i18n/error");
        //设置根据key如果没有获取到对应的文本信息,则返回key作为信息
        source.setUseCodeAsDefaultMessage(true);
        //设置字符编码
        source.setDefaultEncoding("UTF-8");
        return source;
    }


}