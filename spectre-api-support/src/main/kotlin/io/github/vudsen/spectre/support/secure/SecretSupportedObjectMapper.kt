package io.github.vudsen.spectre.support.secure

import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.module.SimpleModule

object SecretSupportedObjectMapper {

    val instance: JsonMapper = JsonMapper.builderWithJackson2Defaults()
        .addModule(SimpleModule().apply {
        }).build()


}