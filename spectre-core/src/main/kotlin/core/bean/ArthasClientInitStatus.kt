package io.github.vudsen.spectre.core.bean

import io.github.vudsen.spectre.api.dto.AttachStatus
import io.github.vudsen.spectre.common.progress.ProgressManager
import java.util.concurrent.atomic.AtomicBoolean

class ArthasClientInitStatus(val channelId: String, var lastAccess: Long) {
    /**
     * 客户端初始化锁，避免并发，每次限制只有一个线程能够初始化，并且在初始化完全或失败前，锁将保持持有
     */
    var clientInitLock: AtomicBoolean = AtomicBoolean(false)

    /**
     * 在创建客户端时的错误信息
     */
    var error: AttachStatus.ErrorInfo? = null

    /**
     * 进度指示器，用于获取当前初始化进度
     */
    val progressManager = ProgressManager()
}