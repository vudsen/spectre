package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.LogEntityPO
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository

@Repository
interface LogEntityRepository : JpaRepository<LogEntityPO, Long>, QueryByExampleExecutor<LogEntityPO>