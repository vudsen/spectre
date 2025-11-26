package io.github.vudsen.spectre.api.plugin.rnode

/**
 * 表示该允许节点需要在使用完毕后关闭。
 */
interface CloseableRuntimeNode : RuntimeNode {

    /**
     * 是否存活
     */
    fun isAlive(): Boolean

    /**
     * 关闭连接
     * @return 退出码
     */
    fun close(): Int


}