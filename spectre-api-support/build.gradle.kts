plugins {
    kotlin("jvm")
    alias(libs.plugins.springBoot)
    alias(libs.plugins.springDependencyManagement)
}

group = "io.github.vudsen.spectre"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
    implementation(project(":spectre-api"))
    implementation("org.slf4j:slf4j-api")
    implementation("org.apache.commons", "commons-compress", libs.versions.apacheCommons.get())
    implementation("tools.jackson.core:jackson-core")
    implementation("tools.jackson.core:jackson-databind")
    implementation("org.springframework.boot:spring-boot")
}

tasks.test {
    useJUnitPlatform()
}

tasks.bootJar {
    enabled = false
}