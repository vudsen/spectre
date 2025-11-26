package io.github.vudsen.spectre.common.progress

fun checkCanceled() {
    if (Thread.currentThread().isInterrupted) {
        throw InterruptedException("Task was cancelled")
    }
}

