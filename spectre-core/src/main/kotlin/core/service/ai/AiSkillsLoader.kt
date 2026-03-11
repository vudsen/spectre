package io.github.vudsen.spectre.core.service.ai

import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets

@Component
class AiSkillsLoader {

    private val resolver = PathMatchingResourcePatternResolver()

    fun loadAllSkills(): List<Pair<String, String>> {
        val resources = resolver.getResources("classpath*:skills/*.md")
        return resources
            .filter { it.exists() }
            .sortedBy { it.filename ?: "" }
            .map { resource ->
                val name = resource.filename?.substringBeforeLast(".") ?: "unknown"
                val content = resource.inputStream.use { String(it.readAllBytes(), StandardCharsets.UTF_8) }
                name to content
            }
    }

    fun buildSkillsPrompt(): String {
        val skills = loadAllSkills()
        if (skills.isEmpty()) {
            return ""
        }
        return buildString {
            appendLine("You have the following troubleshooting skills. Choose the most suitable skill and follow it.")
            for ((name, content) in skills) {
                appendLine("## Skill: $name")
                appendLine(content.trim())
                appendLine()
            }
        }
    }
}
