package io.github.vudsen.spectre.repo.entity

enum class ToolchainType(
    val originalName: String,
    val bundleExtensionName: String,
) {
    ARTHAS("arthas", "zip"),
    JATTACH("jattach", "tgz"),
    HTTP_CLIENT("http-client", "jar");
}