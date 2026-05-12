package io.github.vudsen.spectre.core.integrate.ai.tool

import com.fasterxml.jackson.annotation.JsonClassDescription
import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonClassDescription("Execute arthas command request")
class ExecuteArthasCommandRequest {
    var command: String = ""
}
