package io.github.vudsen.spectre.repo.util

/**
 * twitter的snowflake算法 -- java实现
 *
 * [SourceCode](https://github.com/beyondfengyu/SnowFlake)
 *
 * @author beyond
 * @date 2016/11/26
 */
object SnowFlake {
    var datacenterId: Long = 0 //数据中心
    var machineId: Long = 0//机器标识
    private var sequence = 0L //序列号
    private var lastStmp = -1L //上一次时间戳

    /**
     * 产生下一个ID
     *
     * @return
     */
    @Synchronized
    fun nextId(): Long {
        var currStmp = this.newstmp
        if (currStmp < lastStmp) {
            throw RuntimeException("Clock moved backwards.  Refusing to generate id")
        }

        if (currStmp == lastStmp) {
            //相同毫秒内，序列号自增
            sequence = (sequence + 1) and MAX_SEQUENCE
            //同一毫秒的序列数已经达到最大
            if (sequence == 0L) {
                currStmp = this.nextMill
            }
        } else {
            //不同毫秒内，序列号置为0
            sequence = 0L
        }

        lastStmp = currStmp

        return ((currStmp - START_STMP) shl TIMESTMP_LEFT.toInt() //时间戳部分
                or (datacenterId shl DATACENTER_LEFT.toInt() //数据中心部分
                ) or (machineId shl MACHINE_LEFT.toInt() //机器标识部分
                ) or sequence) //序列号部分
    }

    private val nextMill: Long
        get() {
            var mill = this.newstmp
            while (mill <= lastStmp) {
                mill = this.newstmp
            }
            return mill
        }

    private val newstmp: Long
        get() = System.currentTimeMillis()

    /**
     * 起始的时间戳
     */
    private const val START_STMP = 1480166465631L

    /**
     * 每一部分占用的位数
     */
    private const val SEQUENCE_BIT: Long = 12 //序列号占用的位数
    private const val MACHINE_BIT: Long = 5 //机器标识占用的位数
    private const val DATACENTER_BIT: Long = 5 //数据中心占用的位数

    /**
     * 每一部分的最大值
     */
    private val MAX_SEQUENCE = -1L xor (-1L shl SEQUENCE_BIT.toInt())

    /**
     * 每一部分向左的位移
     */
    private val MACHINE_LEFT = SEQUENCE_BIT
    private val DATACENTER_LEFT = SEQUENCE_BIT + MACHINE_BIT
    private val TIMESTMP_LEFT = DATACENTER_LEFT + DATACENTER_BIT

}