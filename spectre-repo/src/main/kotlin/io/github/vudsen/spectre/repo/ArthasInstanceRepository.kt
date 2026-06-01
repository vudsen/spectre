package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.ArthasInstancePO
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface ArthasInstanceRepository :
    JpaRepository<ArthasInstancePO, String>,
    QueryByExampleExecutor<ArthasInstancePO> {
    fun deleteAllByLastAccessBefore(instant: Instant): Long
}
