package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.ChannelPO
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository

@Repository
interface ChannelRepository :
    JpaRepository<ChannelPO, Long>,
    QueryByExampleExecutor<ChannelPO> {

    fun findFirstByInstanceIds(instanceIds: List<String>): ChannelPO?
}
