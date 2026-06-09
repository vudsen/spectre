package io.github.vudsen.spectre.core.controller

import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.api.entity.ProfilerFile
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.ChannelService
import io.github.vudsen.spectre.api.vo.ChannelInfoVO
import io.github.vudsen.spectre.core.audit.Log
import io.github.vudsen.spectre.core.controller.ws.ArthasPullResultCoordinator
import io.github.vudsen.spectre.core.util.MultipartFileAdapter
import io.github.vudsen.spectre.core.vo.BatchExecResponseVO
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
    private val arthasPullResultCoordinator: ArthasPullResultCoordinator,
) {
    /**
     * @return Channel Id
     */
    @PostMapping("create-instance")
    fun createInstance(
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
        arthasPullResultCoordinator.joinChannel(channelId, request.getSession(true))
        val channel = arthasPullResultCoordinator.resolveChannel(channelId)
        return joinChannelInternal(request, channel != null, channelId)
    }

    @GetMapping("/channel/{channelId}/pull-result", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun pullResults(
        @PathVariable channelId: String,
        request: HttpServletRequest,
    ): Map<String, ArrayNode> =
        arthasPullResultCoordinator.pullResultsForChannel(
            channelId,
            request.getSession(false) ?: throw BusinessException("error.channel.not.exist"),
        )

    private fun joinChannelInternal(
        request: HttpServletRequest,
        isBatchChannel: Boolean,
        channelId: String,
    ): List<ChannelInfoVO> {
        if (!isBatchChannel) {
            val consumer =
                arthasPullResultCoordinator.resolveChannelSession(
                    request.getSession(false) ?: throw BusinessException("error.channel.not.exist"),
                    channelId,
                )
            return listOf(ChannelInfoVO("unused", consumer.name, channelId))
        } else {
            return channelService.resolveChannelById(channelId.toLong())
        }
    }

    private fun resolveChannelSession(
        request: HttpServletRequest,
        instanceId: String,
    ) = arthasPullResultCoordinator.resolveChannelSession(
        request.getSession(false) ?: throw BusinessException("error.channel.not.exist"),
        instanceId,
    )

    private fun exactErrorMsg(e: Exception): String = arthasPullResultCoordinator.exactErrorMsg(e)

    private fun channelSessionDataKey(instanceId: String): String = "InstanceIdToConsumerId:$instanceId"

    @PostMapping("/channel/{channelId}/execute")
    @Log("log.arthas.channel.execute", "{ channelId: #args[0], command: #args[1].command  }")
    fun execute(
        @PathVariable channelId: String,
        @Validated @RequestBody vo: ExecuteCommandRequestVO,
        request: HttpServletRequest,
    ): Map<String, BatchExecResponseVO> {
        val channel =
            channelId.toLongOrNull()?.let {
                channelService.findById(it)
            }
        if (channel == null) {
            // ensure connected.
            resolveChannelSession(request, channelId)
            arthasExecutionService.execAsync(channelId, vo.command)
            return mapOf(channelId to BatchExecResponseVO(true))
        } else {
            return buildMap {
                for (instanceId in channel.instanceIds) {
                    resolveChannelSession(request, instanceId)
                    try {
                        arthasExecutionService.execAsync(instanceId, vo.command)
                        put(instanceId, BatchExecResponseVO(true))
                    } catch (e: Exception) {
                        val msg = exactErrorMsg(e)
                        put(instanceId, BatchExecResponseVO(false, msg))
                    }
                }
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
        val channel =
            channelId.toLongOrNull()?.let {
                channelService.findById(it)
            }
        if (channel == null) {
            arthasExecutionService.interruptCommand(channelId)
        } else {
            for (instanceIds in channel.instanceIds) {
                try {
                    arthasExecutionService.interruptCommand(instanceIds)
                } catch (_: Exception) {
                }
            }
        }
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
