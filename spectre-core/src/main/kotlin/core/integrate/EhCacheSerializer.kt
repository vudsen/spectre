package io.github.vudsen.spectre.core.integrate

import com.esotericsoftware.kryo.Kryo
import com.esotericsoftware.kryo.io.Input
import com.esotericsoftware.kryo.io.Output
import org.ehcache.spi.serialization.Serializer
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.util.function.Supplier

class EhCacheSerializer<T>(/* Required args */ loader: ClassLoader?) : Serializer<T?> {

    override fun serialize(obj: T?): ByteBuffer {
        val kryo: Kryo = kryoThreadLocal.get()
        val bos = ByteArrayOutputStream()
        Output(bos).use { output ->
            kryo.writeClassAndObject(output, obj)
            output.flush()
            return ByteBuffer.wrap(bos.toByteArray())
        }
    }

    @Throws(ClassNotFoundException::class)
    override fun read(binary: ByteBuffer): T? {
        val kryo: Kryo = kryoThreadLocal.get()
        val bytes = ByteArray(binary.remaining())
        binary.get(bytes)
        Input(bytes).use { input ->
            return kryo.readClassAndObject(input) as T?
        }
    }

    @Throws(ClassNotFoundException::class)
    override fun equals(obj: T?, binary: ByteBuffer): Boolean {
        return obj == read(binary)
    }

    companion object {
        // Kryo 非线程安全，使用 ThreadLocal 保证并发安全
        private val kryoThreadLocal: ThreadLocal<Kryo> = ThreadLocal.withInitial(Supplier {
            val kryo = Kryo()
            kryo.isRegistrationRequired = false
            kryo.references = true
            kryo
        })
    }
}