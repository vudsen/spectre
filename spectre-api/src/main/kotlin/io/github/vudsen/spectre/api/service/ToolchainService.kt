package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.ToolchainBundleDTO
import io.github.vudsen.spectre.api.dto.ToolchainItemDTO
import io.github.vudsen.spectre.api.vo.ToolchainItemResponseVO
import io.github.vudsen.spectre.repo.entity.ToolchainType
import io.github.vudsen.spectre.repo.po.ToolchainBundlePO
import io.github.vudsen.spectre.repo.po.ToolchainItemPO
import org.springframework.core.io.InputStreamSource
import org.springframework.data.domain.Page

interface ToolchainService {


    /**
     * 列出所有工具
     */
    fun listToolchainItems(type: ToolchainType, page: Int, size: Int): Page<ToolchainItemPO>

    /**
     * 列出所有工具包
     */
    fun listToolchainBundles(page: Int, size: Int): Page<ToolchainBundlePO>

    /**
     * 查询工具包
     */
    fun resolveToolchainBundle(id: Long): ToolchainBundleDTO?

    /**
     * 更新或者创建工具
     * @param p0 实体类
     */
    fun updateOrCreateToolchainItem(po: ToolchainItemPO): ToolchainItemPO

    /**
     * 更新或者创建工具包
     */
    fun updateOrCreateToolchainBundle(po: ToolchainBundlePO): ToolchainBundlePO

    /**
     * 检查包是否缓存到本地.
     *
     * 该方法仅适用于单机部署，用于手动上传工具包。对于集群环境，该方法不一定可靠.
     */
    fun isPackageCached(type: ToolchainType, tag: String, isArm: Boolean): Boolean

    /**
     * 将包缓存到本地
     */
    fun cachePackageToLocal(type: ToolchainType, tag: String, isArm: Boolean, source: InputStreamSource)

    /**
     * 根据 id 查询工具
     */
    fun findToolchainItemById(type: ToolchainType, tag: String): ToolchainItemDTO?

}