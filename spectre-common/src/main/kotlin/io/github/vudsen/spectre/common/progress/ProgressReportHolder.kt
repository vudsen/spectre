package io.github.vudsen.spectre.common.progress

object ProgressReportHolder {
    private val progressThreadLocal = ThreadLocal<ProgressManager>()

    fun startProgress(manager: ProgressManager) {
        progressThreadLocal.set(manager)
    }

    fun currentProgressManager(): ProgressManager? = progressThreadLocal.get()

    fun clear() {
        progressThreadLocal.remove()
    }
}
