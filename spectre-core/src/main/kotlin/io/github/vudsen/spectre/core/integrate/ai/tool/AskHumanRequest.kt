package io.github.vudsen.spectre.core.integrate.ai.tool

import com.fasterxml.jackson.annotation.JsonClassDescription
import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonClassDescription("Ask human request")
class AskHumanRequest {
    var question: String = ""

    /**
     * 可用的选项.
     */
    var options: List<String> = emptyList()
}
