package io.github.vudsen.spectre.test

import org.junit.jupiter.api.Assertions

/**
 * 循环执行代码，每次执行完睡眠一秒钟. 如果代码没有执行成功，最终会报错。
 * @param times 要循环多少次，如果循环完毕后还没有退出，则会报错
 * @param fn 要执行的代码，返回 true 将会中断循环
 */
fun <T> loop(times: Int, fn: () -> T?): T {
    for (i in 0..times) {
        fn() ?.let {
            return it
        }
        Thread.sleep(1000)
    }
    Assertions.fail<Unit>("Loop timeout.")
    throw IllegalStateException("Unreachable code.")
}