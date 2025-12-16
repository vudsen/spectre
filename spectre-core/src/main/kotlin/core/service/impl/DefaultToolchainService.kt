package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.repo.ToolchainBundleRepository
import io.github.vudsen.spectre.repo.ToolchainItemRepository
import io.github.vudsen.spectre.api.service.ToolchainService
import io.github.vudsen.spectre.common.LocalPackageManager
import io.github.vudsen.spectre.repo.entity.ToolchainType
import io.github.vudsen.spectre.repo.po.ToolchainBundlePO
import io.github.vudsen.spectre.repo.po.ToolchainItemId
import io.github.vudsen.spectre.repo.po.ToolchainItemPO
import org.springframework.core.io.InputStreamSource
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultToolchainService(
    private val toolchainItemRepository: ToolchainItemRepository,
    private val toolchainBundleRepository: ToolchainBundleRepository
) : ToolchainService {

    override fun listToolchainItems(
        type: ToolchainType,
        page: Int,
        size: Int
    ): Page<ToolchainItemPO> {
        return toolchainItemRepository.findByIdTypeOrderByIdTagDesc(type, PageRequest.of(page, size))
    }

    override fun listToolchainBundles(
        page: Int,
        size: Int
    ): Page<ToolchainBundlePO> {
        return toolchainBundleRepository.findAll(PageRequest.of(page, size))
    }

    override fun resolveToolchainBundle(id: Long): ToolchainBundlePO? {
        return toolchainBundleRepository.findById(id).getOrNull()
    }


    override fun updateOrCreateToolchainItem(po: ToolchainItemPO): ToolchainItemPO {
        return toolchainItemRepository.save(po)
    }

    override fun updateOrCreateToolchainBundle(po: ToolchainBundlePO): ToolchainBundlePO {
        return toolchainBundleRepository.save(po)
    }

    override fun isPackageCached(
        type: ToolchainType,
        tag: String,
        isArm: Boolean
    ): Boolean {
        return LocalPackageManager.isCached(type, tag, isArm)
    }

    override fun cachePackageToLocal(
        type: ToolchainType,
        tag: String,
        isArm: Boolean,
        source: InputStreamSource
    ) {
        if (!toolchainItemRepository.existsById(ToolchainItemId(type, tag))) {
            throw BusinessException("error.toolchain.not.exit")
        }
        // TODO: 检查工具包是否有 arm 的
        LocalPackageManager.savePackage(type, tag, isArm, source)
    }
}