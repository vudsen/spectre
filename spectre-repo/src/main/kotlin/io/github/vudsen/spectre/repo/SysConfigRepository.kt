package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.SysConfigPO
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository

@Repository
interface SysConfigRepository  : JpaRepository<SysConfigPO, Long>, QueryByExampleExecutor<SysConfigPO> {

    fun findFirstByCode(code: String): SysConfigPO?

}