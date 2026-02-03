package io.github.vudsen.spectre.repo.entity

enum class ToolchainType(
    val originalName: String,
    val bundleExtensionName: String,
) {
    ARTHAS("arthas", "zip"),
    JATTACH("jattach", "tgz"),
}