package io.github.vudsen.spectre

import io.github.vudsen.spectre.common.ApplicationContextHolder
import io.github.vudsen.spectre.common.SpectreEnvironment
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.cache.annotation.EnableCaching
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.transaction.annotation.EnableTransactionManagement

@SpringBootApplication
@EntityScan("io.github.vudsen.spectre.repo.po")
@EnableCaching
@EnableTransactionManagement
@EnableScheduling
class SpectreApplication

fun main(vararg args: String) {
    System.setProperty("spectre.home", SpectreEnvironment.SPECTRE_HOME)
    val applicationContext = SpringApplication.run(SpectreApplication::class.java, *args)
    ApplicationContextHolder.applicationContext = applicationContext
}