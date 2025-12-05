package io.github.vudsen.spectre.api.entity

class TypedPageDescriptor<T>(
    pageName: String,
    parameters: T
) : PageDescriptor(pageName, parameters)