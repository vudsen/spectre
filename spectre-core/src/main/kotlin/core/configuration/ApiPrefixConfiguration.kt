package io.github.vudsen.spectre.core.configuration

import io.github.vudsen.spectre.core.integrate.NoApiPrefix
import org.springframework.boot.autoconfigure.web.servlet.WebMvcRegistrations
import org.springframework.boot.autoconfigure.web.servlet.error.BasicErrorController
import org.springframework.context.annotation.Configuration
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.RequestMappingInfo
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping
import java.lang.reflect.Method


@Configuration
class ApiPrefixConfiguration : WebMvcRegistrations {

    override fun getRequestMappingHandlerMapping(): RequestMappingHandlerMapping {
        return object : RequestMappingHandlerMapping() {
            protected override fun registerHandlerMethod(handler: Any, method: Method, mapping: RequestMappingInfo) {
                if (method.getDeclaringClass() == BasicErrorController::class.java || method.isAnnotationPresent(NoApiPrefix::class.java)) {
                    return super.registerHandlerMethod(handler, method, mapping)
                }
                super.registerHandlerMethod(
                    handler,
                    method,
                    RequestMappingInfo.paths("/spectre-api")
                        .build()
                        .combine(mapping)
                )
            }
        }
    }

}