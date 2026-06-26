package io.github.vudsen.spectre.core.integrate.ai

import io.github.vudsen.spectre.api.entity.Skill
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import java.nio.charset.StandardCharsets

object AiSkillsLoader {
    private const val SKILL_CONTENT = "__CONTENT__"
    private const val META_END = "\n---\n"

    private val resolver = PathMatchingResourcePatternResolver()

    @Volatile
    private var cache: SkillCache? = null

    private data class SkillCache(
        val skillsMeta: List<Skill>,
        val skillContentByName: Map<String, String>,
    )

    fun loadAllSkills(): List<Skill> = getOrInitCache().skillsMeta

    /**
     * 加载 Skill 内容
     */
    fun loadSkill(name: String): String =
        getOrInitCache().skillContentByName[name]
            ?: throw IllegalArgumentException("Skill not found: $name")

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
        val resources =
            resolver
                .getResources("classpath*:skills/**/*.md")
                .filter { it.exists() }
                .sortedBy { it.filename ?: "" }

        val entries =
            resources.map { resource ->
                val content = resource.inputStream.use { String(it.readAllBytes(), StandardCharsets.UTF_8) }
                val frontMatter = parseSkill(content)
                val name =
                    frontMatter["name"]?.takeIf { it.isNotBlank() }
                        ?: throw IllegalStateException("Skill file ${resource.filename ?: "unknown"} missing front matter name")
                val description =
                    frontMatter["description"]?.takeIf { it.isNotBlank() }
                        ?: throw IllegalStateException("Skill file ${resource.filename ?: "unknown"} missing front matter description")
                Skill(name, description, frontMatter["nameI18nKey"], frontMatter["descriptionI18nKey"]) to frontMatter[SKILL_CONTENT]!!
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

    private fun parseSkill(markdown: String): Map<String, String> {
        val normalized = markdown.replace("\r\n", "\n")
        if (!normalized.startsWith("---\n")) {
            throw IllegalStateException("Skill markdown missing front matter")
        }

        val endIndex = normalized.indexOf(META_END, startIndex = 4)
        if (endIndex < 0) {
            throw IllegalStateException("Skill markdown front matter not closed")
        }

        val frontMatter = normalized.substring(4, endIndex)
        return buildMap {
            put(SKILL_CONTENT, markdown.substring(endIndex + META_END.length).trim())
            frontMatter
                .lineSequence()
                .map { it.trim() }
                .filter { it.isNotBlank() && !it.startsWith("#") }
                .forEach { line ->
                    val index = line.indexOf(':')
                    if (index > 0) {
                        val key = line.substring(0, index).trim()
                        val value = line.substring(index + 1).trim().trim('"', '\'')
                        key to value
                        put(key, value)
                    }
                }
        }
    }
}
