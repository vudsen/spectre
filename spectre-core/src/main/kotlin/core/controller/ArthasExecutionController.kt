package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.entity.ProfilerFile
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.core.util.MultipartFileAdapter
import io.github.vudsen.spectre.core.vo.CreateChannelRequestVO
import io.github.vudsen.spectre.core.vo.ExecuteCommandRequestVO
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.core.io.InputStreamResource
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.context.request.RequestAttributes
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.util.UriUtils
import java.nio.charset.StandardCharsets


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
    // 该接口是轮询调用，开启后会记录大量日志
    // @Log("log.arthas.channel.create", "{ runtimeNodeId: #args[0].runtimeNodeId, channelId: #returnObj?.channelId }")
    fun createChannel(@RequestBody @Validated vo: CreateChannelRequestVO, request: HttpServletRequest): AttachStatus {
        return arthasExecutionService.requireAttach(vo.runtimeNodeId, vo.treeNodeId, vo.bundleId)
    }


    /**
     * @return consumerId
     */
    @PostMapping("/channel/{channelId}/join")
    @Log("log.arthas.channel.join", "{ channelId: #args[0], consumerId: #returnObj?.consumerId }")
    fun joinChannel(@PathVariable channelId: String, request: HttpServletRequest): ArthasConsumerDTO? {
        return joinChannel0(request, channelId)
    }

    /**
     * @return consumerId
     */
    private fun joinChannel0(request: HttpServletRequest, channelId: String): ArthasConsumerDTO? {
        val session = request.getSession(true)
        val key = channelSessionDataKey(channelId)
        val oldConsumerId = session.getAttribute(key) as ArthasConsumerDTO?
        if (oldConsumerId != null) {
            return oldConsumerId
        }
        val currentSavedConsumerId = session.getAttribute(key) as ArthasConsumerDTO?
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
    ): ArthasConsumerDTO {
        val session = request.getSession(false)
        if (session == null) {
            throw NamedExceptions.SESSION_EXPIRED.toException()
        }
        val channelSession = session.getAttribute(channelSessionDataKey(channelId)) as ArthasConsumerDTO?
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

    @PostMapping("/channel/{channelId}/execute-sync")
    @Log("log.arthas.channel.execute", "{ channelId: #args[0], command: #args[1].command  }")
    fun executeSync(@PathVariable channelId: String, @Validated @RequestBody vo: ExecuteCommandRequestVO, request: HttpServletRequest): Any {
        resolveChannelSession(request, channelId)
        return arthasExecutionService.execSync(channelId, vo.command.trim())
    }

    @PostMapping("/channel/{channelId}/disconnect")
    @Log("log.arthas.channel.disconnect", "{ channelId: #args[0] }")
    fun disconnect(@PathVariable channelId: String, request: HttpServletRequest) {
        val session = request.getSession(false)
        session.removeAttribute(channelSessionDataKey(channelId))
        // 让 arthas 自己自动删除
//        arthasExecutionService.execAsync("stop")
    }

    @PostMapping("/channel/{channelId}/interrupt")
    @Log("log.arthas.channel.interrupt", "{ channelId: #args[0] }")
    fun interruptCommand(@PathVariable channelId: String, request: HttpServletRequest) {
        resolveChannelSession(request, channelId)
        arthasExecutionService.interruptCommand(channelId)
    }

    @PostMapping("/channel/{channelId}/retransform")
    @Log("log.arthas.channel.execute", "{ channelId: #args[0], command: '@retransform'  }")
    fun retransform(@PathVariable channelId: String, file: MultipartFile, request: HttpServletRequest): Any {
        resolveChannelSession(request, channelId)
        return arthasExecutionService.retransform(channelId, MultipartFileAdapter(file))
    }

    @GetMapping("/channel/{channelId}/profiler-files")
    fun listProfilerFiles(@PathVariable channelId: String, request: HttpServletRequest): List<ProfilerFile> {
        resolveChannelSession(request, channelId)
        return arthasExecutionService.listProfilerFiles(channelId)
    }

    @GetMapping("/channel/{channelId}/profiler/html", produces = [MediaType.TEXT_HTML_VALUE])
    fun readProfilerFileAsHtml(file: ProfilerFile, @PathVariable channelId: String, request: HttpServletRequest, response: HttpServletResponse): String {
        if (file.extension != "html") {
            throw BusinessException("仅支持预览 html 文件")
        }
        resolveChannelSession(request, channelId)
        val source = arthasExecutionService.readProfilerFile(file) ?: throw BusinessException("文件不存在")
        response.setHeader("Cache-Control", "max-age=10800")
        source.use { source ->
            if (source.size() >= 1024 * 1024 * 16) {
                throw BusinessException("文件过大，请下载后查看")
            }
            val bytes = source.inputStream.readAllBytes()
            return String(bytes)
        }
    }


    @GetMapping("/channel/{channelId}/profiler/download")
    fun downloadProfilerFile(file: ProfilerFile, @PathVariable channelId: String, request: HttpServletRequest, response: HttpServletResponse): ResponseEntity<Resource> {
        resolveChannelSession(request, channelId)
        val source = arthasExecutionService.readProfilerFile(file) ?: throw BusinessException("文件不存在")
        val fileName = file.channelId + "-" + file.timestamp + "." + file.extension
        val encodedFileName: String? = UriUtils.encode(fileName, StandardCharsets.UTF_8)

        RequestContextHolder.getRequestAttributes()!!.registerDestructionCallback(
            "cleanupTask",
            Runnable {
                source.close()
            },
            RequestAttributes.SCOPE_REQUEST
        )

        response.setHeader("Cache-Control", "max-age=10800")
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$encodedFileName\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .contentLength(source.size()) // 可选
            .body(InputStreamResource(source));
    }

}
