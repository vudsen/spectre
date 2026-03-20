plugins {
    kotlin("jvm") version "2.3.10"
    alias(libs.plugins.springBoot)
    alias(libs.plugins.springDependencyManagement)
    id("org.jlleitschuh.gradle.ktlint") version "14.2.0" apply false
}

group = "io.github.vudsen.spectre"

allprojects {
    version = providers.gradleProperty("spectreVersion").get()
}

subprojects {
    if (name !in setOf("cli", "cli:http-client")) {
        apply(plugin = "org.jlleitschuh.gradle.ktlint")
        configure<org.jlleitschuh.gradle.ktlint.KtlintExtension> {
            version.set("1.4.1")
            outputToConsole.set(true)
            ignoreFailures.set(false)
        }
    }
}


java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
//    maven{ url=uri("https://maven.aliyun.com/repository/public") }
//    maven{ url=uri("https://maven.aliyun.com/repository/google") }
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.bootJar {
    enabled = false
}
