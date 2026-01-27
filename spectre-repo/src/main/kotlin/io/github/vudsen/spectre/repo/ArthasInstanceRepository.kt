package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.ArthasInstancePO
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import java.time.Instant

interface ArthasInstanceRepository : JpaRepository<ArthasInstancePO, String>, QueryByExampleExecutor<ArthasInstancePO> {

    fun findByChannelId(id: String): ArthasInstancePO?

    fun deleteAllByLastAccessBefore(instant: Instant): Long

}