package io.github.vudsen.spectre.common.util

import tools.jackson.databind.json.JsonMapper

val GLOBAL_JSON_MAPPER: JsonMapper = JsonMapper.builderWithJackson2Defaults().build()

fun Any.toJsonString(): String = GLOBAL_JSON_MAPPER.writeValueAsString(this)
