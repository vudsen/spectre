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
    implementation("org.apache.commons", "commons-compress", libs.versions.apacheCommons.get())
    implementation("org.slf4j:slf4j-api")
}

tasks.test {
    useJUnitPlatform()
}

tasks.bootJar {
    enabled = false
}