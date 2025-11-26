package io.github.vudsen.spectre.core.vo

import io.github.vudsen.spectre.repo.entity.SubjectType
import org.jetbrains.annotations.NotNull

class StaticPermissionModifyVO() {

    @NotNull
    var subjectId: String? = null

    @NotNull
    var subjectType: SubjectType? = null

    @NotNull
    var resource: String? = null

    @NotNull
    var action: String? = null

    /**
     * 如果为 true，表示新增，否则表示删除
     */
    var enabled: Boolean = false


}