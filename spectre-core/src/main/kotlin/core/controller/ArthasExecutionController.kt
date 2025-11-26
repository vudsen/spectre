package io.github.vudsen.spectre.core.controller

import com.fasterxml.jackson.databind.JsonNode
import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.dto.ChannelSessionDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.core.lock.DistributedLock
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.core.vo.CreateChannelRequestVO
import io.github.vudsen.spectre.core.vo.ExecuteCommandRequestVO
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Arthas 交互接口.
 */
@RequestMapping("arthas")
@RestController
@PreAuthorize("hasPermission(null, T(io.github.vudsen.spectre.api.perm.ACLPermissions).RUNTIME_NODE_READ)")
class ArthasExecutionController(
    private val arthasExecutionService: ArthasExecutionService
) {

    private fun channelSessionDataKey(channelId: String): String = "ChannelIdToConsumerId:${channelId}"

    /**
     * @return Channel Id
     */
    @PostMapping("create-channel")
    @Log("log.arthas.channel.create", "{ runtimeNodeId: #args[0].runtimeNodeId, channelId: #returnObj?.channelId }")
    fun createChannel(@RequestBody @Validated vo: CreateChannelRequestVO, request: HttpServletRequest): AttachStatus {
        // TODO: DELETE ME! 在实装登录系统前先这样写着，以防 joinChannel0 方法并发调用时创建多个 session
        request.getSession(true)
        return arthasExecutionService.requireAttach(vo.runtimeNodeId, vo.treeNodeId, vo.bundleId)
    }


    /**
     * @return consumerId
     */
    @PostMapping("/channel/{channelId}/join")
    @Log("log.arthas.channel.join", "{ channelId: #args[0], consumerId: #returnObj?.consumerId }")
    fun joinChannel(@PathVariable channelId: String, request: HttpServletRequest): ChannelSessionDTO? {
        return joinChannel0(request, channelId)
    }

    /**
     * @return consumerId
     */
    private fun joinChannel0(request: HttpServletRequest, channelId: String): ChannelSessionDTO? {
        val session = request.getSession(true)
        val key = channelSessionDataKey(channelId)
        val oldConsumerId = session.getAttribute(key) as ChannelSessionDTO?
        if (oldConsumerId != null) {
            return oldConsumerId
        }
        val currentSavedConsumerId = session.getAttribute(key) as ChannelSessionDTO?
        if (currentSavedConsumerId != oldConsumerId) {
            return currentSavedConsumerId
        }
        val detail = arthasExecutionService.joinChannel(channelId, session.id)
        session.setAttribute(key, detail)
        return detail
    }


    @GetMapping("/channel/{channelId}/pull-result")
    fun pullResults(@PathVariable channelId: String, request: HttpServletRequest): Any {
        val channelSession = resolveChannelSession(request, channelId)
        try {
            return arthasExecutionService.pullResults(channelId, channelSession.consumerId)
        } catch (_: ConsumerNotFountException) {
            val session = request.getSession(false)
            session?.removeAttribute(channelSessionDataKey(channelId))
            throw NamedExceptions.SESSION_EXPIRED.toException()
        }
    }

    private fun resolveChannelSession(
        request: HttpServletRequest,
        channelId: String
    ): ChannelSessionDTO {
        val session = request.getSession(false)
        if (session == null) {
            throw NamedExceptions.SESSION_EXPIRED.toException()
        }
        val channelSession = session.getAttribute(channelSessionDataKey(channelId)) as ChannelSessionDTO?
        if (channelSession == null) {
            throw BusinessException("频道不存在!")
        }
        return channelSession
    }

    @PostMapping("/channel/{channelId}/execute")
    @Log("log.arthas.channel.execute", "{ channelId: #args[0], command: #args[1].command  }")
    fun execute(@PathVariable channelId: String, @Validated @RequestBody vo: ExecuteCommandRequestVO, request: HttpServletRequest) {
        // ensure connected.
        resolveChannelSession(request, channelId)
        arthasExecutionService.execAsync(channelId, vo.command.trim())
    }

    @PostMapping("/channel/{channelId}/disconnect")
    @Log("log.arthas.channel.disconnect", "{ channelId: #args[0] }")
    fun disconnect(@PathVariable channelId: String, request: HttpServletRequest) {
        val session = request.getSession(false)
        session.removeAttribute(channelSessionDataKey(channelId))
        // TODO 调用服务清除内存中的数据，防止内存泄露
        // 让 arthas 自己自动删除
//        arthasExecutionService.execAsync("stop")
    }

    @PostMapping("/channel/{channelId}/interrupt")
    @Log("log.arthas.channel.interrupt", "{ channelId: #args[0] }")
    fun interruptCommand(@PathVariable channelId: String, request: HttpServletRequest) {
        resolveChannelSession(request, channelId)
        arthasExecutionService.interruptCommand(channelId)
    }

}