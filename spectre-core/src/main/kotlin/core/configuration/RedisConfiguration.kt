package io.github.vudsen.spectre.core.configuration

import com.fasterxml.jackson.annotation.JsonAutoDetect
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.PropertyAccessor
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.jsontype.DefaultBaseTypeLimitingValidator
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.JdkSerializationRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializer
import org.springframework.data.redis.serializer.StringRedisSerializer
import java.io.Serializable


@Configuration
@EnableCaching
class RedisConfiguration {

    @Bean
    fun redisTemplate(connectionFactory: RedisConnectionFactory): RedisTemplate<String, Any> {
        val template = RedisTemplate<String, Any>()
        template.connectionFactory = connectionFactory

        // key 用 String 序列化
        val stringSerializer = StringRedisSerializer()

        // 包装一个自定义的序列化器
        val delegatingSerializer: RedisSerializer<Any?> = DelegatingSerializer(GenericJackson2JsonRedisSerializer(), JdkSerializationRedisSerializer())

        template.setKeySerializer(stringSerializer)
        template.setHashKeySerializer(stringSerializer)
        template.setValueSerializer(delegatingSerializer)
        template.setHashValueSerializer(delegatingSerializer)

        template.afterPropertiesSet()
        return template
    }

    companion object {
        val jdkSerializeClass: Set<Class<Any>> = emptySet()
    }

    class DelegatingSerializer internal constructor(
        private val jsonSerializer: RedisSerializer<Any?>,
        private val jdkSerializer: RedisSerializer<Any?>
    ) : RedisSerializer<Any?> {

        override fun serialize(o: Any?): ByteArray? {
            if (o == null) {
                return ByteArray(0)
            }
            // 判断是否是要特殊处理的类
            if (jdkSerializeClass.contains(o.javaClass)) {
                return jdkSerializer.serialize(o)
            }
            return jsonSerializer.serialize(o)
        }

        override fun deserialize(bytes: ByteArray?): Any? {
            if (bytes == null || bytes.size == 0) {
                return null
            }

            // TODO 判断是不是 json
            return jsonSerializer.deserialize(bytes)
//            try {
//                // 先尝试 JSON
//            } catch (e: Exception) {
//                // 如果 JSON 失败，fallback JDK
//                return jdkSerializer.deserialize(bytes)
//            }
        }
    }
}