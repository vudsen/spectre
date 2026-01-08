plugins {
    kotlin("jvm")
    kotlin("plugin.spring") version "2.2.20"
    alias(libs.plugins.springBoot)
    alias(libs.plugins.springDependencyManagement)
}

group = "io.github.vudsen.spectre.core"

repositories {
    mavenCentral()
}

springBoot {
    mainClass.set("io.github.vudsen.spectre.SpectreApplicationKt")
}

dependencies {
    testImplementation(kotlin("test"))
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:testcontainers:2.0.3")
    implementation("org.bouncycastle:bcprov-jdk18on:1.83")
    implementation("org.bouncycastle:bcpkix-jdk18on:1.83")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-graphql")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.liquibase:liquibase-core:5.0.1")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation(project(":spectre-repo"))
    implementation(project(":spectre-api"))
    implementation(project(":spectre-common"))
    implementation(libs.sshdCore)
    implementation(libs.sshdSftp)
    implementation("com.squareup.okhttp3:okhttp:5.3.0")
    implementation("org.apache.commons", "commons-compress", libs.versions.apacheCommons.get())
    implementation("io.lettuce:lettuce-core")
    implementation("org.postgresql:postgresql:42.7.8")
    implementation("org.hibernate.orm:hibernate-community-dialects:7.0.8.Final")
    // 稳定后再删除.
    implementation("org.xerial:sqlite-jdbc:3.50.3.0")
    implementation("org.ehcache:ehcache:3.11.1:jakarta")
    implementation("jakarta.xml.bind:jakarta.xml.bind-api")
    implementation("org.glassfish.jaxb:jaxb-runtime")
    implementation("com.esotericsoftware:kryo:5.6.2")
}
tasks.test {
    useJUnitPlatform()
}

tasks.register("prepareKotlinBuildScriptModel"){}

kotlin {
    jvmToolchain(17)
}