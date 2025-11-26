package io.github.vudsen.spectre.core.lock

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.script.DefaultRedisScript
import org.springframework.stereotype.Component
import java.util.*
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import kotlin.Long
import kotlin.String
import kotlin.checkNotNull

/**
 * Redis 分布式锁，支持自动续期/重入
 */
@Component
class RedisDistributedLock(private val redisTemplate: StringRedisTemplate) {


    private val scheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(1);



    // 保存当前线程持有的锁及重入次数
    private val threadLockMap: ThreadLocal<MutableMap<String, LockData>> =
        ThreadLocal.withInitial {
            mutableMapOf()
        }

    /**
     * 加锁
     */
    fun tryLock(key: String): Boolean {
        val lockKey = LOCK_PREFIX + key
        val lockVal = UUID.randomUUID().toString() + "-" + Thread.currentThread().getId()

        // 支持重入：如果当前线程已经持有锁，增加计数即可
        val locks: MutableMap<String, LockData> = threadLockMap.get()
        val data = locks.get(lockKey)
        if (data != null) {
            data.count.incrementAndGet()
            return true
        }

        // 尝试加锁
        val success = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, lockVal, LOCK_EXPIRE, TimeUnit.SECONDS)

        if (success == true) {
            // 成功加锁，启动自动续期
            val renewalTask = scheduler.scheduleAtFixedRate(Runnable {
                val `val` = redisTemplate.opsForValue().get(lockKey)
                if (lockVal == `val`) {
                    redisTemplate.expire(lockKey, LOCK_EXPIRE, TimeUnit.SECONDS)
                }
            }, RENEW_INTERVAL, RENEW_INTERVAL, TimeUnit.SECONDS)

            locks.put(lockKey, LockData(lockVal, renewalTask))
            return true
        }

        return false
    }

    /**
     * 解锁
     */
    fun unlock(key: String) {
        val lockKey = LOCK_PREFIX + key
        val locks = threadLockMap.get()
        val data: LockData = locks.get(lockKey)!!

        checkNotNull(data) { "当前线程未持有锁: $lockKey" }

        val newCount = data.count.decrementAndGet()
        if (newCount > 0) {
            return  // 还有重入次数，不释放
        }

        // 停止续期
        data.renewalTask.cancel(true)

        // Lua 脚本保证原子性删除
        val lua = "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                "return redis.call('del', KEYS[1]) else return 0 end"
        redisTemplate.execute<Long?>(
            DefaultRedisScript<Long?>(lua, Long::class.java),
            mutableListOf<String?>(lockKey), data.lockVal
        )

        locks.remove(lockKey)
    }

    /**
     * 锁数据结构
     */
    private class LockData(val lockVal: String, val renewalTask: ScheduledFuture<*>) {
        val count: AtomicInteger = AtomicInteger(1)
    }

    companion object {
        private const val LOCK_PREFIX = "dist:lock:"
        private const val LOCK_EXPIRE: Long = 30 // 锁过期时间（秒）
        private const val RENEW_INTERVAL: Long = 10 // 续期间隔（秒）
    }
}
