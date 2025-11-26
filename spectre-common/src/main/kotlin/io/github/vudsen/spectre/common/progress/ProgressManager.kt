package io.github.vudsen.spectre.common.progress

import java.util.Stack

class ProgressManager {

    private val states = Stack<CurrentProgress>()


    fun pushState(title: String, message: String? = null) {
        states.push(CurrentProgress(title, message))
    }

    fun currentProgress(): CurrentProgress? {
        if (states.isEmpty()) {
            return null
        }
        return states.peek()
    }

    fun popState() {
        states.pop()
    }

}