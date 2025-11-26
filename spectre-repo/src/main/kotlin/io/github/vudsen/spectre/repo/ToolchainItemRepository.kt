package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.entity.ToolchainType
import io.github.vudsen.spectre.repo.po.ToolchainItemId
import io.github.vudsen.spectre.repo.po.ToolchainItemPO
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository

@Repository
interface ToolchainItemRepository : JpaRepository<ToolchainItemPO, ToolchainItemId>, QueryByExampleExecutor<ToolchainItemPO> {

    /**
     * 根据类型查询所有工具
     */
    fun findByIdTypeOrderByIdTagDesc(type: ToolchainType, pageable: Pageable): Page<ToolchainItemPO>

}