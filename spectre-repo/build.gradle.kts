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
    api("jakarta.persistence:jakarta.persistence-api")
    api("jakarta.validation:jakarta.validation-api")
    api("com.fasterxml.jackson.core:jackson-core")
    api("com.fasterxml.jackson.core:jackson-databind")
    api("org.springframework.data:spring-data-jpa")
    api("org.hibernate.orm:hibernate-core")
}

tasks.test {
    useJUnitPlatform()
}

tasks.bootJar {
    enabled = false
}