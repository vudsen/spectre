package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.ToolchainBundlePO
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository

/**
 * 预期数据流不大
 */
@Repository
interface ToolchainBundleRepository : JpaRepository<ToolchainBundlePO, Long>, QueryByExampleExecutor<ToolchainBundlePO> {

    fun findFirstByJattachTag(jattachTag: String): List<ToolchainBundlePO>

    fun findFirstByArthasTag(arthasTag: String): List<ToolchainBundlePO>

    fun findFirstByHttpClientTag(httpClientTag: String): List<ToolchainBundlePO>

}