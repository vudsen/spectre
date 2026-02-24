package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.api.exception.PermissionDenyException
import io.github.vudsen.spectre.api.perm.PolicyPermissionContext
import io.github.vudsen.spectre.api.perm.EmptyContext
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.policy.PolicyPermissionContextExample
import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.common.plugin.PolicyAuthenticationExtManager
import io.github.vudsen.spectre.common.plugin.PolicyAuthenticationProviderManager
import io.github.vudsen.spectre.core.integrate.UserWithID
import io.github.vudsen.spectre.repo.PolicyPermissionRepository
import io.github.vudsen.spectre.repo.RoleRepository
import io.github.vudsen.spectre.repo.UserRepository
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.PolicyPermissionPO
import org.slf4j.LoggerFactory
import org.springframework.expression.spel.standard.SpelExpression
import org.springframework.expression.spel.standard.SpelExpressionParser
import org.springframework.expression.spel.support.StandardEvaluationContext
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import java.util.WeakHashMap
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultAppAccessControlService(
    private val policyPermissionRepository: PolicyPermissionRepository,
    private val roleRepository: RoleRepository,
    private val userRepository: UserRepository,
    private val policyAuthenticationProviderManager: PolicyAuthenticationProviderManager,
    private val policyAuthenticationExtManager: PolicyAuthenticationExtManager,
) : AppAccessControlService {

    companion object {
        private const val ADMIN_ROLE = 1L
        private const val TRUE = "true"
    }

    private val logger = LoggerFactory.getLogger(DefaultAppAccessControlService::class.java)

    private val spelParser = SpelExpressionParser()

    private val objectMapper = ObjectMapper()

    private fun fulfillContext(map: MutableMap<String, Any>): UserWithID {
        val principal = SecurityContextHolder.getContext().authentication!!.principal
        if (principal !is UserWithID) {
            throw NamedExceptions.FORBIDDEN.toException()
        }
        val user = userRepository.findById(principal.id).getOrNull() ?: throw NamedExceptions.FORBIDDEN.toException()
        map.put("user", user)
        return principal
    }

    private fun returnDefaultContext(): List<PolicyPermissionContextExample> {
        val context = mutableMapOf<String, Any>()
        fulfillContext(context)
        return listOf(PolicyPermissionContextExample("默认上下文", context))
    }

    override fun resolveExamplePolicyPermissionContext(permissionEntity: PermissionEntity): List<PolicyPermissionContextExample> {
        val provider = policyAuthenticationProviderManager.findByPermissionEntity(permissionEntity) ?: return returnDefaultContext()
        val examples = provider.createExampleContext()
        for (example in examples) {
            fulfillContext(example.context)
        }
        return examples
    }

    override fun hasPermission(
        userId: Long,
        permissionEntity: PermissionEntity
    ): Boolean {
        val ctx = EmptyContext(permissionEntity)
        val provider = policyAuthenticationProviderManager.findByPermissionEntity(permissionEntity)

        val context: MutableMap<String, Any> = provider?.toContextMap(ctx) ?: mutableMapOf()
        val user = fulfillContext(context)

        return isAccessibleByPolicy(user.id, permissionEntity, context)
    }


    override fun checkPolicyPermission(context: PolicyPermissionContext) {
        var provider = policyAuthenticationProviderManager.findByContext(context)
        val spelContext = provider.toContextMap(context)
        val user = fulfillContext(spelContext)

        if (isAccessibleByPolicy(user.id, context.resource, spelContext)) {
            return
        }
        provider.customiseErrorException() ?.let {
            throw it
        }
        throw NamedExceptions.FORBIDDEN.toException()
    }

    private val expressionCache = WeakHashMap<String, SpelExpression>()

    private fun isAccessibleByPolicy(
        userId: Long,
        permissionEntity: PermissionEntity,
        spELContext: Map<String, Any>
    ): Boolean {
        val roleIds = roleRepository.findUserRoleIds(userId)
        if (roleIds.isEmpty()) {
            return false
        }
        if (roleIds.contains(ADMIN_ROLE)) {
            return true
        }
        var lastException: PermissionDenyException? = null
        for (roleId in roleIds) {
            val policies =
                policyPermissionRepository.findAllBySubjectTypeAndSubjectIdAndResourceAndAction(
                    SubjectType.ROLE,
                    roleId,
                    permissionEntity.resource,
                    permissionEntity.action
                )

            for (policy in policies) {
                if (!checkOgnlExpression(policy, spELContext)) {
                    continue
                }

                // ognl expression passed
                if (policy.enhancePlugins.isEmpty()) {
                    return true
                }
                for (plugin in policy.enhancePlugins) {
                    val ext = policyAuthenticationExtManager.getById(plugin.pluginId)
                    try {
                        if (ext.hasPermission(
                                spELContext,
                                objectMapper.readValue(plugin.configuration, ext.getConfigurationClass())
                            )
                        ) {
                            return true
                        }
                    } catch (e: PermissionDenyException) {
                        lastException = e
                    }
                }
            }
        }
        lastException?.let {
            throw lastException
        }
        return false
    }

    private fun checkOgnlExpression(
        policy: PolicyPermissionPO,
        spELContext: Map<String, Any>
    ): Boolean {
        val expressionString = policy.conditionExpression!!

        if (expressionString == TRUE) {
            return true
        }
        val expression = expressionCache.compute(expressionString) { k, v ->
            if (v == null) {
                try {
                    return@compute spelParser.parseRaw(expressionString)
                } catch (e: Exception) {
                    logger.error("", e)
                    throw BusinessException("解析表达式出错，请联系管理员")
                }
            }
            return@compute v
        }!!

        val context = StandardEvaluationContext()
        for (entry in spELContext) {
            context.setVariable(entry.key, entry.value)
        }
        return try {
            expression.getValue(context, Boolean::class.java)
        } catch (e: Exception) {
            logger.error("", e)
            throw BusinessException("SpEL 脚本执行错误，请联系管理员")
        } == true
    }


}