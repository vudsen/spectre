package io.github.vudsen.spectre.test

import org.testcontainers.containers.GenericContainer
import org.testcontainers.utility.DockerImageName

object TestContainerUtils {

    const val REDIS_PASSWORD = "123456"

    fun createMathGameSshMachine(): GenericContainer<*> {
        val sshContainer = GenericContainer(DockerImageName.parse("vudsen/ssh-server-with-math-game:0.0.3")).apply{
            withExposedPorts(22)
        }
        sshContainer.start();
        return sshContainer
    }

    fun createRedis(): GenericContainer<*> {
        val container = GenericContainer(DockerImageName.parse("redis:8.4")).apply {
            withExposedPorts(6379)
            withCommand("redis-server", "--requirepass", REDIS_PASSWORD)
        }
        container.start()
        return container

    }

}