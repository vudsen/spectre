package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.CreateToolchainBundleDTO
import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.dto.ToolchainItemDTO
import io.github.vudsen.spectre.api.dto.ToolchainItemDTO.Companion.toDTO
import io.github.vudsen.spectre.api.dto.UpdateToolchainBundleDTO
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
import java.sql.Timestamp
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultToolchainService(
    private val toolchainItemRepository: ToolchainItemRepository,
    private val toolchainBundleRepository: ToolchainBundleRepository,
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

    private fun findToolchainItemAndRequireNonnull(id: ToolchainItemId) =
        toolchainItemRepository.findById(id)
        .getOrNull()
        ?.toDTO() ?: throw BusinessException("error.toolchain.not.exist", arrayOf(id.tag, id.type?.originalName))

    override fun resolveToolchainBundle(id: Long): ToolchainBundleDTO? {
        val bundle = toolchainBundleRepository.findById(id).getOrNull() ?: return null
        return ToolchainBundleDTO(
            findToolchainItemAndRequireNonnull(ToolchainItemId(ToolchainType.JATTACH, bundle.jattachTag)),
            findToolchainItemAndRequireNonnull(ToolchainItemId(ToolchainType.ARTHAS, bundle.arthasTag)),
        )
    }

    override fun updateOrCreateToolchainItem(dto: ToolchainItemDTO) {
        toolchainItemRepository.save(
            ToolchainItemPO(
                ToolchainItemId(dto.type, dto.tag),
                dto.url,
                dto.armUrl ?: "",
                Timestamp(System.currentTimeMillis())
            )
        )
    }



    override fun saveToolchainBundle(po: ToolchainBundlePO): ToolchainBundlePO {
        return toolchainBundleRepository.save(po)
    }

    override fun updateToolchainBundle(dto: UpdateToolchainBundleDTO) {
        val po = toolchainBundleRepository.findById(dto.id).getOrNull() ?: throw BusinessException("bundle 不存在")
        dto.name?.let {
            po.name = it
        }
        dto.arthasTag?.let {
            po.arthasTag = it
        }
        dto.jattachTag?.let {
            po.jattachTag = it
        }
        toolchainBundleRepository.save(po)
    }

    override fun createToolchainBundle(dto: CreateToolchainBundleDTO) {
        toolchainBundleRepository.save(ToolchainBundlePO(
            name = dto.name,
            jattachTag = dto.jattachTag,
            arthasTag = dto.arthasTag
        ))
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

    override fun findToolchainItemById(
        type: ToolchainType,
        tag: String
    ): ToolchainItemDTO? {
        return toolchainItemRepository.findById(ToolchainItemId(type, tag)).getOrNull()?.toDTO()
    }

    override fun deleteToolchainItemById(id: ToolchainItemId) {
        val bundle = when(id.type!!) {
            ToolchainType.ARTHAS -> toolchainBundleRepository.findFirstByArthasTag(id.tag!!)
            ToolchainType.JATTACH -> toolchainBundleRepository.findFirstByJattachTag(id.tag!!)
        }
        if (bundle.isNotEmpty()) {
            val bundlePO = bundle.get(0)
            throw BusinessException("error.toolchain.item.in.use", arrayOf(bundlePO.name))
        }
        toolchainItemRepository.deleteById(id)
    }

    override fun deleteToolchainBundleById(id: Long) {
        toolchainBundleRepository.deleteById(id)
    }
}