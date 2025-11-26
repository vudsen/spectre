package io.github.vudsen.spectre.core.util


/**
 * 用于自旋操作, 调用 [sleepSuspend] 会睡眠当前协程，调用次数越多，睡眠的时间也就越久.
 */
class SpinHelper(
    private val step: Long = 50,
    private val maxSleepMilliseconds: Long = 1000
) {

    private var currentMilliseconds: Long = 0L

    /**
     * 睡眠一段时间，每次睡眠的时间会随着调用的次数越来越久
     */
    fun sleep() {
        Thread.sleep(currentMilliseconds)
        currentMilliseconds = (currentMilliseconds + step).coerceAtMost(maxSleepMilliseconds)
    }

    /**
     * 反馈某次操作成功.
     *
     * 当某次操作成功后，它的下一次大概率仍然是成功，或者直接退出了命令，所以这里直接将计数器设置成 0
     */
    fun reportSuccess() {
        currentMilliseconds = 0
    }

}