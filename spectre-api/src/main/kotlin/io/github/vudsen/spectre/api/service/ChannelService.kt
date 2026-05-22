package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.vo.ChannelInfoVO
import io.github.vudsen.spectre.repo.po.ChannelPO

interface ChannelService {
    fun resolveChannelId(id: Long): List<ChannelInfoVO>

    /**
     * @return channel id
     */
    fun createChannel(instanceIds: List<String>): Long

    fun findById(id: Long): ChannelPO?
}
