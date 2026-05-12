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
    compileOnly("org.springframework.boot:spring-boot")
    implementation("org.slf4j:slf4j-api")
    implementation("tools.jackson.core:jackson-databind")
}

tasks.test {
    useJUnitPlatform()
}

tasks.bootJar {
    enabled = false
}
