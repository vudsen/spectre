package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.service.ArthasInstanceService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("admin-tools")
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).ALL)")
class AdminToolController {

    @Autowired
    lateinit var arthasInstanceService: ArthasInstanceService

    /**
     * 清除数据库中所有缓存的 arthasInstance
     */
    @PostMapping("/clear-arthas-instance")
    fun clearArthasInstance() {
        arthasInstanceService.clearCachedClient()
    }

}