package io.github.vudsen.spectre.test

import org.testcontainers.containers.GenericContainer
import org.testcontainers.utility.DockerImageName

object TestContainerUtils {

    fun createMathGameSshMachine(): GenericContainer<*> {
        return setupContainer("vudsen/ssh-server-with-math-game:0.0.3")
    }

    /**
     * 创建容器
     */
    private fun setupContainer(image: String): GenericContainer<*> {
        val sshContainer = GenericContainer(DockerImageName.parse(image))
        sshContainer.start();
        return sshContainer
    }

}