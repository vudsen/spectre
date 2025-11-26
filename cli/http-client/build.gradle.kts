plugins {
    application
}

group = "io.github.vudsen.spectre.httpclient"

application {
    mainClass.set("io.github.vudsen.spectre.httpclient.Main")
}

repositories {
    mavenCentral()
}


tasks.test {
    useJUnitPlatform()
}
tasks.jar {
    manifest {
        attributes["Main-Class"] = application.mainClass.get()
    }

    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
