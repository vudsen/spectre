package io.github.vudsen.spectre.core.vo

import io.github.vudsen.spectre.repo.util.CreateGroup
import io.github.vudsen.spectre.repo.util.UpdateGroup
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Null


data class ToolchainBundleModifyVO(
    @Min(1, groups = [UpdateGroup::class])
    @Null(groups = [CreateGroup::class])
    var id: Long = -1,
    @NotEmpty(groups = [CreateGroup::class])
    var name: String = "",
    @NotEmpty(groups = [CreateGroup::class])
    var jattachTag: String = "",
    @NotEmpty(groups = [CreateGroup::class])
    var arthasTag: String? = null,
    @NotEmpty(groups = [CreateGroup::class])
    var httpClientTag: String? = null,
)