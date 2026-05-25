package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.ChannelService
import io.github.vudsen.spectre.api.vo.ChannelInfoVO
import io.github.vudsen.spectre.repo.ArthasInstanceRepository
import io.github.vudsen.spectre.repo.ChannelRepository
import io.github.vudsen.spectre.repo.RuntimeNodeRepository
import io.github.vudsen.spectre.repo.po.ChannelPO
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultChannelService(
    private val channelRepository: ChannelRepository,
    private val runtimeNodeRepository: RuntimeNodeRepository,
    private val instanceRepository: ArthasInstanceRepository,
) : ChannelService {
    override fun resolveChannelById(id: Long): List<ChannelInfoVO> {
        val channel = channelRepository.findById(id).getOrNull() ?: throw BusinessException("error.channel.not.exist")
        val instances = instanceRepository.findAllById(channel.instanceIds)
        val runtimeNodes = runtimeNodeRepository.findAllById(instances.map { instance -> instance.runtimeNodeId })

        return buildList {
            for (instance in instances) {
                val runtimeNodeName =
                    runtimeNodes.find { r -> r.id == instance.runtimeNodeId }?.name
                        ?: throw BusinessException("error.runtime.node.not.exist")
                add(ChannelInfoVO(runtimeNodeName, instance.jvm.name, instance.id))
            }
        }
    }


    @Transactional(rollbackOn = [Exception::class])
    override fun createChannel(instanceIds: List<String>): Long {
        channelRepository.findFirstByInstanceIds(instanceIds)?.let {
            println("========================== ======${it.id}")
            return it.id
        }
        val id = channelRepository
            .save(
                ChannelPO().apply {
                    this.instanceIds = instanceIds
                },
            ).id
        println("================================${id}")
        return id
    }


    override fun findById(id: Long): ChannelPO? = channelRepository.findById(id).getOrNull()
}
