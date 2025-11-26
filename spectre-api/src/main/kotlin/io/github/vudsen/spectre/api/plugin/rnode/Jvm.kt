package io.github.vudsen.spectre.api.plugin.rnode

abstract class Jvm (
    /**
     * id，可以是 pid，也可以是容器id 或者容器名称
     */
    val id: String,
    var name: String,
//    val context: JvmContext
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Jvm

        if (id != other.id) return false
        if (name != other.name) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id.hashCode()
        result = 31 * result + name.hashCode()
        return result
    }
}