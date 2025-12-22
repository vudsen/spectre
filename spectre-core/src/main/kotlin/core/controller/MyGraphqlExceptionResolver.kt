package io.github.vudsen.spectre.core.controller

import graphql.ErrorClassification
import graphql.GraphQLError
import graphql.GraphqlErrorBuilder
import graphql.schema.DataFetchingEnvironment
import io.github.vudsen.spectre.api.exception.BusinessException
import org.springframework.context.MessageSource
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter
import org.springframework.graphql.execution.ErrorType
import org.springframework.security.authorization.AuthorizationDeniedException
import org.springframework.stereotype.Component

@Component
class MyGraphqlExceptionResolver(
    private val messageSource: MessageSource
) : DataFetcherExceptionResolverAdapter() {

    override fun resolveToSingleError(ex: Throwable, env: DataFetchingEnvironment): GraphQLError? {
        if (ex is BusinessException) {
            return GraphqlErrorBuilder.newError(env)
                .message(messageSource.getMessage(ex.messageKey, ex.messageArgs, null))
                .path(env.executionStepInfo.path)
                .location(env.field.sourceLocation)
                .build()
        } else if (ex is AuthorizationDeniedException) {
            return GraphqlErrorBuilder.newError(env)
                .errorType(ErrorType.FORBIDDEN)
                .message(messageSource.getMessage("error.permission.deny", emptyArray(), null))
                .path(env.executionStepInfo.path)
                .location(env.field.sourceLocation)
                .build()
        }
        return null
    }

}