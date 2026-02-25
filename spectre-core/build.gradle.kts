import org.apache.tools.ant.filters.ReplaceTokens

plugins {
    kotlin("jvm")
    kotlin("plugin.spring") version "2.3.10"
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

sourceSets {
    create("integrationTest") {
        compileClasspath += sourceSets.main.get().output + sourceSets.test.get().output
        runtimeClasspath += sourceSets.main.get().output + sourceSets.test.get().output
    }
}

val integrationTestImplementation: Configuration by configurations.getting {
    extendsFrom(configurations.testImplementation.get())
}

val integrationTestRuntimeOnly: Configuration by configurations.getting {
    extendsFrom(configurations.testRuntimeOnly.get())
}

dependencies {
    testImplementation(kotlin("test"))
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    integrationTestImplementation("org.springframework.boot:spring-boot-starter-graphql-test")
    integrationTestImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    integrationTestImplementation("org.springframework.boot:spring-boot-webtestclient")
    integrationTestImplementation("org.springframework.graphql:spring-graphql-test:2.0.2")
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
    implementation("org.springframework.boot:spring-boot-starter-liquibase")
    implementation("org.liquibase:liquibase-core:5.0.1")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation(project(":spectre-repo"))
    implementation(project(":spectre-api"))
    implementation(project(":spectre-common"))
    implementation(libs.sshdCore)
    implementation(libs.sshdSftp)
    implementation("com.squareup.okhttp3:okhttp:5.3.2")
    implementation("org.apache.commons", "commons-compress", libs.versions.apacheCommons.get())
    implementation("io.lettuce:lettuce-core")
    implementation("org.postgresql:postgresql:42.7.9")
    implementation("org.hibernate.orm:hibernate-community-dialects")
    // 稳定后再删除.
    implementation("org.xerial:sqlite-jdbc:3.51.2.0")
    implementation("org.ehcache:ehcache:3.11.1:jakarta")
    implementation("jakarta.xml.bind:jakarta.xml.bind-api")
    implementation("org.glassfish.jaxb:jaxb-runtime")
    implementation("com.esotericsoftware:kryo:5.6.2")
}




fun Copy.configureTokenReplace() {
    inputs.properties(
        mapOf(
            "version" to project.version.toString(),
        )
    )

    filesMatching("**/*.yaml") {
        filter(
            ReplaceTokens::class,
            "tokens" to mapOf(
                "version" to project.version.toString(),
            )
        )
    }
}


tasks.test {
    useJUnitPlatform()
}
tasks.register("prepareKotlinBuildScriptModel"){}
tasks.register("wrapper"){}
tasks.processResources {
    configureTokenReplace()
}
tasks.processTestResources {
    configureTokenReplace()
}
tasks.named<ProcessResources>("processIntegrationTestResources") {
    configureTokenReplace()
    from(project.file("src/main/resources/graphql")) {
        into("graphql")
    }
}

tasks.register<Test>("integrationTest") {
    description = "Runs integration tests."
    group = "verification"
    testClassesDirs = sourceSets["integrationTest"].output.classesDirs
    classpath = sourceSets["integrationTest"].runtimeClasspath

    outputs.upToDateWhen { false }

    useJUnitPlatform()
}


kotlin {
    jvmToolchain(17)
}