package io.github.vudsen.spectre.common

import org.springframework.context.ApplicationContext

object ApplicationContextHolder {


    lateinit var applicationContext: ApplicationContext


    fun getAppVersion(): String {
        return applicationContext.environment.getProperty("spring.application.version")!!
    }

}