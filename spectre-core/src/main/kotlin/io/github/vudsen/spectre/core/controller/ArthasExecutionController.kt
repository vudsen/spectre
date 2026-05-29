package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.dto.ArthasConsumerDTO
import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.entity.ProfilerFile
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.ConsumerNotFountException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.ChannelService
import io.github.vudsen.spectre.api.vo.ChannelInfoVO
import io.github.vudsen.spectre.common.util.KeyBasedLock
import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.core.util.MultipartFileAdapter
import io.github.vudsen.spectre.core.vo.BatchPullResultVO
import io.github.vudsen.spectre.core.vo.CreateChannelRequestVO
import io.github.vudsen.spectre.core.vo.ExecuteCommandRequestVO
import io.github.vudsen.spectre.repo.po.ChannelPO
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.io.InputStreamResource
import org.springframework.core.io.Resource
import org.springframework.core.task.TaskExecutor
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.context.request.RequestAttributes
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.util.UriUtils
import tools.jackson.databind.node.ArrayNode
import java.nio.charset.StandardCharsets
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Arthas 交互接口.
 *
 * 目前有两种交互类型：
 * - 单个交互(连接一个 arthas 实例)，对应 [io.github.vudsen.spectre.repo.po.ArthasInstancePO]
 * - 另外一个是批量交互(同时连接多个 arthas)，对应 [io.github.vudsen.spectre.repo.po.ChannelPO]
 *
 * 目前虽然单个交互部分参数名称使用的也是 channelId，这是历史遗留问题，这个 channelId 实际是 [io.github.vudsen.spectre.repo.po.ArthasInstancePO.id]，
 * 单个交互**不会**创建 [io.github.vudsen.spectre.repo.po.ChannelPO]
 *
 * TODO: 统一交互逻辑，考虑为单个交互也创建 channel? 以后只有批量交互，单个交互视为*只连接了一个实例的批量交互*
 */
@RequestMapping("arthas")
@RestController
@PreAuthorize("hasPermission(0, T(io.github.vudsen.spectre.api.perm.AppPermissions).RUNTIME_NODE_READ)")
class ArthasExecutionController(
    private val arthasExecutionService: ArthasExecutionService,
    private val channelService: ChannelService,
    @param:Qualifier("applicationTaskExecutor") private val executor: TaskExecutor,
) {
    private val logger = LoggerFactory.getLogger(ArthasExecutionController::class.java)

    private fun channelSessionDataKey(instanceId: String): String = "InstanceIdToConsumerId:$instanceId"

    private val joinLock = KeyBasedLock(executor)

    /**
     * @return Channel Id
     */
    @PostMapping("create-channel")
    fun createChannel(
        @RequestBody @Validated vo: CreateChannelRequestVO,
    ): AttachStatus = arthasExecutionService.requireAttach(vo.runtimeNodeId, vo.treeNodeId, vo.bundleId)

    /**
     * @return consumerId
     */
    @PostMapping("/channel/{channelId}/join")
    @Log("log.arthas.channel.join", "{ channelId: #args[0] }")
    fun joinChannel(
        @PathVariable channelId: String,
        request: HttpServletRequest,
    ): List<ChannelInfoVO> {
        val channel =
            channelId.toLongOrNull()?.let {
                channelService.findById(it)
            }
        return joinChannelInternal(channel, request, channelId)
    }

    /**
     * @return consumerId
     */
    private fun joinChannelForSingleInstance(
        request: HttpServletRequest,
        instanceId: String,
    ): ArthasConsumerDTO {
        val session = request.getSession(true)
        val lockKey = session.id + ":" + instanceId
        joinLock.lock(lockKey) {
            val key = channelSessionDataKey(instanceId)
            val oldConsumerId = session.getAttribute(key) as ArthasConsumerDTO?
            if (oldConsumerId != null) {
                return oldConsumerId
            }
            val detail = arthasExecutionService.joinChannel(instanceId, session.id)
            session.setAttribute(key, detail)
            return detail
        }
    }

    @GetMapping("/channel/{channelId}/pull-result", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun pullResults(
        @PathVariable channelId: String,
        request: HttpServletRequest,
    ): Map<String, BatchPullResultVO> {
        val channel =
            channelId.toLongOrNull()?.let {
                channelService.findById(it)
            }
        if (channel == null) {
            try {
                val channelSession = resolveChannelSession(request, channelId)
                return mapOf(
                    channelId to BatchPullResultVO(false, null, arthasExecutionService.pullResults(channelId, channelSession.consumerId)),
                )
            } catch (_: ConsumerNotFountException) {
                return mapOf(channelId to BatchPullResultVO(false, null, recreateConsumerAndPull(request, channelId)))
            }
        } else {
            return buildMap {
                val latch = CountDownLatch(channel.instanceIds.size)
                for (instanceId in channel.instanceIds) {
                    val ctx = SecurityContextHolder.getContext()
                    executor.execute {
                        SecurityContextHolder.setContext(ctx)
                        try {
                            try {
                                val channelSession = resolveChannelSession(request, instanceId)
                                put(
                                    instanceId,
                                    BatchPullResultVO(
                                        false,
                                        null,
                                        arthasExecutionService.pullResults(instanceId, channelSession.consumerId),
                                    ),
                                )
                            } catch (_: ConsumerNotFountException) {
                                put(instanceId, BatchPullResultVO(false, null, recreateConsumerAndPull(request, instanceId)))
                            } finally {
                                latch.countDown()
                                SecurityContextHolder.clearContext()
                            }
                        } catch (e: Exception) {
                            val errorMessage =
                                if (e is BusinessException) {
                                    e.toI18nMessage()
                                } else {
                                    logger.error("", e)
                                    "Internal Server Error"
                                }
                            put(instanceId, BatchPullResultVO(true, errorMessage, null))
                        }
                    }
                }
                latch.await(3, TimeUnit.SECONDS)
            }
        }
    }

    private fun recreateConsumerAndPull(
        request: HttpServletRequest,
        instanceId: String,
    ): ArrayNode {
        val session = request.getSession(false) ?: throw NamedExceptions.SESSION_EXPIRED.toException()
        session.removeAttribute(channelSessionDataKey(instanceId))
        try {
            // reconnect.
            val consumerDTO = joinChannelForSingleInstance(request, instanceId)
            return arthasExecutionService.pullResults(instanceId, consumerDTO.consumerId) as ArrayNode
        } catch (_: ConsumerNotFountException) {
            throw NamedExceptions.SESSION_EXPIRED.toException()
        }
    }

    private fun joinChannelInternal(
        channel: ChannelPO?,
        request: HttpServletRequest,
        channelId: String,
    ): List<ChannelInfoVO> {
        if (channel == null) {
            val r = joinChannelForSingleInstance(request, channelId)
            return listOf(ChannelInfoVO("unused", r.name, channelId))
        } else {
            for (instanceId in channel.instanceIds) {
                joinChannelForSingleInstance(request, instanceId)
            }
            return channelService.resolveChannelById(channelId.toLong())
        }
    }

    private fun resolveChannelSession(
        request: HttpServletRequest,
        instanceId: String,
    ): ArthasConsumerDTO {
        val session = request.getSession(false) ?: throw NamedExceptions.SESSION_EXPIRED.toException()
        val channelSession =
            session.getAttribute(channelSessionDataKey(instanceId)) as ArthasConsumerDTO?
                ?: throw BusinessException("error.channel.not.exist")
        return channelSession
    }

    @PostMapping("/channel/{channelId}/execute")
    @Log("log.arthas.channel.execute", "{ channelId: #args[0], command: #args[1].command  }")
    fun execute(
        @PathVariable channelId: String,
        @Validated @RequestBody vo: ExecuteCommandRequestVO,
        request: HttpServletRequest,
    ) {
        val channel =
            channelId.toLongOrNull()?.let {
                channelService.findById(it)
            }
        if (channel == null) {
            // ensure connected.
            resolveChannelSession(request, channelId)
            arthasExecutionService.execAsync(channelId, vo.command)
        } else {
            for (instanceId in channel.instanceIds) {
                resolveChannelSession(request, instanceId)
                arthasExecutionService.execAsync(instanceId, vo.command)
            }
        }
    }

    @PostMapping("/channel/{channelId}/execute-sync", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Log("log.arthas.channel.execute", "{ channelId: #args[0], command: #args[1].command  }")
    fun executeSync(
        @PathVariable channelId: String,
        @Validated @RequestBody vo: ExecuteCommandRequestVO,
        request: HttpServletRequest,
    ): String {
        resolveChannelSession(request, channelId)
        return arthasExecutionService.execSync(channelId, vo.command.trim()).toString()
    }

    @PostMapping("/channel/{channelId}/disconnect")
    @Log("log.arthas.channel.disconnect", "{ channelId: #args[0] }")
    fun disconnect(
        @PathVariable channelId: String,
        request: HttpServletRequest,
    ) {
        val session = request.getSession(false)
        session.removeAttribute(channelSessionDataKey(channelId))
        // 让 arthas 自己自动删除
//        arthasExecutionService.execAsync("stop")
    }

    @PostMapping("/channel/{channelId}/interrupt")
    @Log("log.arthas.channel.interrupt", "{ channelId: #args[0] }")
    fun interruptCommand(
        @PathVariable channelId: String,
        request: HttpServletRequest,
    ) {
        resolveChannelSession(request, channelId)
        arthasExecutionService.interruptCommand(channelId)
    }

    @PostMapping("/channel/{channelId}/retransform", MediaType.APPLICATION_JSON_VALUE)
    @Log("log.arthas.channel.execute", "{ channelId: #args[0], command: '@retransform'  }")
    fun retransform(
        @PathVariable channelId: String,
        file: MultipartFile,
        request: HttpServletRequest,
    ): String {
        resolveChannelSession(request, channelId)
        return arthasExecutionService.retransform(channelId, MultipartFileAdapter(file)).toString()
    }

    @GetMapping("/channel/{channelId}/profiler-files")
    fun listProfilerFiles(
        @PathVariable channelId: String,
        request: HttpServletRequest,
    ): List<ProfilerFile> {
        resolveChannelSession(request, channelId)
        return arthasExecutionService.listProfilerFiles(channelId)
    }

    @GetMapping("/channel/{channelId}/profiler/html", produces = [MediaType.TEXT_HTML_VALUE])
    fun readProfilerFileAsHtml(
        file: ProfilerFile,
        @PathVariable channelId: String,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): String {
        if (file.extension != "html") {
            throw BusinessException("error.profiler.preview.html.only")
        }
        resolveChannelSession(request, channelId)
        val source = arthasExecutionService.readProfilerFile(file) ?: throw BusinessException("error.file.not.found")
        response.setHeader("Cache-Control", "max-age=10800")
        source.use { source ->
            if (source.size() >= 1024 * 1024 * 16) {
                throw BusinessException("error.file.too.large.for.preview")
            }
            val bytes = source.inputStream.readAllBytes()
            return String(bytes)
        }
    }

    @GetMapping("/channel/{channelId}/profiler/download")
    fun downloadProfilerFile(
        file: ProfilerFile,
        @PathVariable channelId: String,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Resource> {
        resolveChannelSession(request, channelId)
        val source = arthasExecutionService.readProfilerFile(file) ?: throw BusinessException("error.file.not.found")
        val fileName = file.instanceId + "-" + file.timestamp + "." + file.extension
        val encodedFileName: String = UriUtils.encode(fileName, StandardCharsets.UTF_8)

        RequestContextHolder.getRequestAttributes()!!.registerDestructionCallback(
            "cleanupTask",
            Runnable {
                source.close()
            },
            RequestAttributes.SCOPE_REQUEST,
        )

        response.setHeader("Cache-Control", "max-age=10800")
        return ResponseEntity
            .ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$encodedFileName\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .contentLength(source.size()) // 可选
            .body(InputStreamResource(source))
    }

    @PostMapping("batch/create-instances")
    fun batchCreateInstance(
        @RequestBody @Validated vos: List<CreateChannelRequestVO>,
    ): Map<String, AttachStatus> =
        buildMap {
            for (vo in vos) {
                put(vo.treeNodeId, arthasExecutionService.requireAttach(vo.runtimeNodeId, vo.treeNodeId, vo.bundleId))
            }
        }

    @PostMapping("batch/create-channel")
    fun createChannel(
        @RequestBody instanceIds: List<String>,
    ): String = "\"${channelService.createChannel(instanceIds)}\""
}
