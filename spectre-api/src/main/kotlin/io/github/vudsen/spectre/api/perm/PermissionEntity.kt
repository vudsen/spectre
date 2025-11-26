package io.github.vudsen.spectre.api.perm

class PermissionEntity(
    val resource: String,
    val action: String,
    val name: String
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as PermissionEntity

        if (resource != other.resource) return false
        if (action != other.action) return false

        return true
    }

    override fun hashCode(): Int {
        var result = resource.hashCode()
        result = 31 * result + action.hashCode()
        return result
    }
}