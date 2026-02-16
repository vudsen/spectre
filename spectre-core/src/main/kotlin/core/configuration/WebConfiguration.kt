package io.github.vudsen.spectre.core.configuration

import jakarta.servlet.http.HttpServletRequest
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.Resource
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.resource.ResourceResolver
import org.springframework.web.servlet.resource.ResourceResolverChain


@Configuration
class WebConfiguration : WebMvcConfigurer {

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/spectre", "/spectre/**")
            .addResourceLocations("classpath:/static/")
            .resourceChain(true)
            .addResolver(object : ResourceResolver {
                override fun resolveResource(
                    request: HttpServletRequest?,
                    requestPath: String,
                    locations: List<Resource>,
                    chain: ResourceResolverChain
                ): Resource? {
                    if (locations.isEmpty()) {
                        return null
                    }
                    if (requestPath.contains('.')) {
                        try {
                            return locations[0].createRelative(requestPath)
                        } catch (_: Exception) {
                            return locations[0].createRelative("index.html")
                        }
                    }
                    return locations[0].createRelative("index.html")
                }

                override fun resolveUrlPath(
                    resourcePath: String,
                    locations: List<Resource>,
                    chain: ResourceResolverChain
                ): String? {
                    TODO("Not yet implemented")
                }

            })
    }

}