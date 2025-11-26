package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.repo.entity.ToolchainType
import io.github.vudsen.spectre.repo.po.ToolchainBundlePO
import io.github.vudsen.spectre.repo.po.ToolchainItemPO
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
    fun resolveToolchainBundle(id: Long): ToolchainBundlePO?

    /**
     * 更新或者创建工具
     * @param p0 实体类
     */
    fun updateOrCreateToolchainItem(po: ToolchainItemPO): ToolchainItemPO

    /**
     * 更新或者创建工具包
     */
    fun updateOrCreateToolchainBundle(po: ToolchainBundlePO): ToolchainBundlePO

}