package io.github.vudsen.spectre.api.exception

class PermissionDenyException(
    messageKey: String,
    messageArgs: Array<Any?> = emptyArray(),
) : BusinessException(messageKey, messageArgs)