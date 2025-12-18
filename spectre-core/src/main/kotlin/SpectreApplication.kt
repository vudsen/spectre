package io.github.vudsen.spectre

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession
import org.springframework.transaction.annotation.EnableTransactionManagement

@SpringBootApplication
@EntityScan("io.github.vudsen.spectre.repo.po")
@EnableRedisHttpSession
@EnableTransactionManagement
@EnableScheduling
class SpectreApplication

fun main(vararg args: String) {
    SpringApplication.run(SpectreApplication::class.java, *args)
}