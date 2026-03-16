package io.github.vudsen.spectre.core.service.ai

import io.github.vudsen.spectre.api.dto.SkillDTO
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets

@Component
class AiSkillsLoader {

    private val resolver = PathMatchingResourcePatternResolver()

    @Volatile
    private var cache: SkillCache? = null

    private data class SkillCache(
        val skillsMeta: List<SkillDTO>,
        val skillContentByName: Map<String, String>,
    )

    fun loadAllSkills(): List<SkillDTO> {
        return getOrInitCache().skillsMeta
    }

    /**
     * 加载 Skill 内容
     */
    fun loadSkill(name: String): String {
        return getOrInitCache().skillContentByName[name]
            ?: throw IllegalArgumentException("Skill not found: $name")
    }

    private fun getOrInitCache(): SkillCache {
        cache?.let { return it }
        synchronized(this) {
            cache?.let { return it }
            val initialized = loadFromResources()
            cache = initialized
            return initialized
        }
    }

    private fun loadFromResources(): SkillCache {
        val resources = resolver.getResources("classpath*:skills/**/*.md")
            .filter { it.exists() }
            .sortedBy { it.filename ?: "" }

        val entries = resources.map { resource ->
            val content = resource.inputStream.use { String(it.readAllBytes(), StandardCharsets.UTF_8) }
            val frontMatter = parseFrontMatter(content)
            val name = frontMatter["name"]?.takeIf { it.isNotBlank() }
                ?: throw IllegalStateException("Skill file ${resource.filename ?: "unknown"} missing front matter name")
            val description = frontMatter["description"]?.takeIf { it.isNotBlank() }
                ?: throw IllegalStateException("Skill file ${resource.filename ?: "unknown"} missing front matter description")
            SkillDTO(name, description) to content
        }

        val skillsMeta = entries.map { it.first }
        val contentByName = linkedMapOf<String, String>()
        for ((skill, content) in entries) {
            if (contentByName.containsKey(skill.name)) {
                throw IllegalStateException("Duplicated skill name: ${skill.name}")
            }
            contentByName[skill.name] = content
        }

        return SkillCache(
            skillsMeta = skillsMeta,
            skillContentByName = contentByName.toMap(),
        )
    }

    private fun parseFrontMatter(markdown: String): Map<String, String> {
        val normalized = markdown.replace("\r\n", "\n")
        if (!normalized.startsWith("---\n")) {
            throw IllegalStateException("Skill markdown missing front matter")
        }

        val endIndex = normalized.indexOf("\n---\n", startIndex = 4)
        if (endIndex < 0) {
            throw IllegalStateException("Skill markdown front matter not closed")
        }

        val frontMatter = normalized.substring(4, endIndex)
        return frontMatter
            .lineSequence()
            .map { it.trim() }
            .filter { it.isNotBlank() && !it.startsWith("#") }
            .mapNotNull { line ->
                val index = line.indexOf(':')
                if (index <= 0) {
                    null
                } else {
                    val key = line.substring(0, index).trim()
                    val value = line.substring(index + 1).trim().trim('"', '\'')
                    key to value
                }
            }
            .toMap()
    }
}
