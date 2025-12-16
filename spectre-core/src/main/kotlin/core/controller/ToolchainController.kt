package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.ToolchainService
import io.github.vudsen.spectre.repo.entity.ToolchainType
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController()
@RequestMapping("toolchain")
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).TOOL_CHAIN_READ)")
class ToolchainController(
    private val toolchainService: ToolchainService
) {


    @PostMapping("upload")
    @PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).TOOL_CHAIN_UPDATE)")
    fun upload(
        file: MultipartFile,
        @RequestParam type: ToolchainType,
        @RequestParam tag: String,
        @RequestParam isArm: Boolean
    ) {
        if (file.isEmpty) {
            throw BusinessException("error.file.empty")
        }
        if (file.size > 1024 * 1024 * 20) {
            // unreachable.
            throw BusinessException("file is too big.")
        }
        toolchainService.cachePackageToLocal(type, tag, isArm, file)
    }

}