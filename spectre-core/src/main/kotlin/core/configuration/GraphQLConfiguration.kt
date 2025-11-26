package io.github.vudsen.spectre.core.configuration

import com.fasterxml.jackson.databind.ObjectMapper
import graphql.GraphQLContext
import graphql.execution.CoercedVariables
import graphql.language.IntValue
import graphql.language.StringValue
import graphql.language.Value
import graphql.schema.Coercing
import graphql.schema.CoercingParseLiteralException
import graphql.schema.CoercingParseValueException
import graphql.schema.GraphQLScalarType
import io.github.vudsen.spectre.repo.entity.ToolchainType
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.graphql.execution.RuntimeWiringConfigurer
import java.sql.Timestamp
import java.util.Locale


@Configuration
class GraphQLConfiguration {


    @Bean
    fun timestampGraphQLScalarType(): RuntimeWiringConfigurer {
        return RuntimeWiringConfigurer { builder ->
            builder.scalar(timestamp())
            builder.scalar(json())
            builder.scalar(toolchainType())
            builder.scalar(labels())
            builder.scalar(long())
        }
    }

    fun json(): GraphQLScalarType {


        return GraphQLScalarType.newScalar()
            .name("JSON")
            .description("Dynamic JSON Type")
            .coercing(object : Coercing<Any, String> {

                val objectMapper = ObjectMapper()

                override fun serialize(
                    dataFetcherResult: Any,
                    graphQLContext: GraphQLContext,
                    locale: Locale
                ): String? {
                    return objectMapper.writeValueAsString(dataFetcherResult)
                }

                override fun parseValue(input: Any): Any? {
                    throw UnsupportedOperationException("It's unsafe to parse JSON to a Java object.")
                }

                override fun parseLiteral(input: Any): Any? {
                    throw UnsupportedOperationException("It's unsafe to parse JSON to a Java object.")
                }
            })
            .build()
    }

    fun timestamp(): GraphQLScalarType {
        return GraphQLScalarType.newScalar()
            .name("Timestamp")
            .description("Epoch milliseconds timestamp")
            .coercing(object : Coercing<Timestamp, Long> {

                override fun serialize(dataFetcherResult: Any, graphQLContext: GraphQLContext, locale: Locale): Long? {
                    if (dataFetcherResult is Timestamp) {
                        return dataFetcherResult.time
                    }
                    throw IllegalArgumentException("Expected Instant")
                }

                override fun parseValue(input: Any): Timestamp? {
                    return Timestamp(input.toString().toLong())
                }

                override fun parseLiteral(input: Any): Timestamp? {
                    if (input is IntValue) {
                        return Timestamp((input).value.toLong())
                    }
                    throw CoercingParseLiteralException("Expected IntValue for Timestamp")
                }
            })
            .build()
    }

    fun toolchainType(): GraphQLScalarType {
        return GraphQLScalarType.newScalar()
            .name("ToolchainType")
            .description("ToolchainTypes")
            .coercing(object : Coercing<ToolchainType, String> {
                override fun serialize(
                    dataFetcherResult: Any,
                    graphQLContext: GraphQLContext,
                    locale: Locale
                ): String? {
                    if (dataFetcherResult is ToolchainType) {
                        return dataFetcherResult.name
                    }
                    return dataFetcherResult.toString()
                }

                override fun parseValue(input: Any, graphQLContext: GraphQLContext, locale: Locale): ToolchainType? {
                    try {
                        return ToolchainType.valueOf(input.toString())
                    } catch (_: IllegalStateException) {
                        throw CoercingParseValueException("Unknown type: $input")
                    }
                }

                override fun parseLiteral(
                    input: Value<*>,
                    variables: CoercedVariables,
                    graphQLContext: GraphQLContext,
                    locale: Locale
                ): ToolchainType? {
                    try {
                        if (input is StringValue) {
                            return ToolchainType.valueOf(input.value)
                        } else {
                            return ToolchainType.valueOf(input.toString())
                        }
                    } catch (_: IllegalStateException) {
                        throw CoercingParseValueException("Unknown type: $input")
                    }

                }
            })
            .build()
    }

    fun labels(): GraphQLScalarType {
        return GraphQLScalarType.newScalar()
            .name("Labels")
            .description("Labels")
            .coercing(object : Coercing<Map<String, String>, Map<String, String>> {
                override fun serialize(
                    dataFetcherResult: Any,
                    graphQLContext: GraphQLContext,
                    locale: Locale
                ): Map<String, String>? {
                    return dataFetcherResult as Map<String, String>?
                }

                override fun parseValue(
                    input: Any,
                    graphQLContext: GraphQLContext,
                    locale: Locale
                ): Map<String, String>? {
                    // may not work as well
                    return input as Map<String, String>?
                }

                override fun parseLiteral(
                    input: Value<*>,
                    variables: CoercedVariables,
                    graphQLContext: GraphQLContext,
                    locale: Locale
                ): Map<String, String>? {
                    // may not work as well
                    return input as Map<String, String>?
                }
            }).build()
    }

    /**
     * See [io.github.vudsen.spectre.core.configuration.CommonConfiguration.longToStringModule].
     *
     * 所有的 Long 都会自动被转成 String，这里就给一个类型别名
     */
    fun long(): GraphQLScalarType {
        return GraphQLScalarType.newScalar()
            .name("Long")
            .description("Long")
            .coercing(object : Coercing<Long, String> {
                override fun serialize(
                    dataFetcherResult: Any,
                    graphQLContext: GraphQLContext,
                    locale: Locale
                ): String? {
                    return (dataFetcherResult as Long?).toString()
                }

                override fun parseValue(input: Any, graphQLContext: GraphQLContext, locale: Locale): Long? {
                    return (input as String?)?.toLong()
                }

                override fun parseLiteral(
                    input: Value<*>,
                    variables: CoercedVariables,
                    graphQLContext: GraphQLContext,
                    locale: Locale
                ): Long? {
                    return (input as String?)?.toLong()
                }
            }).build()
    }
}