package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.dto.UserDTO.Companion.toDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.NamedExceptions
import io.github.vudsen.spectre.api.perm.ABACContext
import io.github.vudsen.spectre.api.perm.ACLPermissions
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.plugin.policy.ABACAuthenticationProvider
import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.common.plugin.PolicyAuthenticationExtManager
import io.github.vudsen.spectre.core.integrate.UserWithID
import io.github.vudsen.spectre.repo.PolicyPermissionRepository
import io.github.vudsen.spectre.repo.StaticPermissionRepository
import io.github.vudsen.spectre.repo.RoleRepository
import io.github.vudsen.spectre.repo.UserRepository
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.StaticPermissionPO
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
    private val aclRepository: StaticPermissionRepository,
    private val policyPermissionRepository: PolicyPermissionRepository,
    private val roleRepository: RoleRepository,
    private val userRepository: UserRepository,
    private val providers: List<ABACAuthenticationProvider>,
    private val policyAuthenticationExtManager: PolicyAuthenticationExtManager,
) : AppAccessControlService {

    private val logger = LoggerFactory.getLogger(DefaultAppAccessControlService::class.java)

    private val spelParser = SpelExpressionParser()

    private val objectMapper = ObjectMapper()


    override fun isAccessibleByAcl(
        userId: Long,
        permissionEntity: PermissionEntity
    ): Boolean {
        val roleIds = roleRepository.findUserRoleIds(userId)
        if (roleIds.isEmpty()) {
            return false
        }

        val ids: List<StaticPermissionPO.StaticPermissionId> = buildList {
            for (roleId in roleIds) {
                add(StaticPermissionPO.StaticPermissionId(SubjectType.ROLE, roleId,permissionEntity.resource, permissionEntity.action))
                add(StaticPermissionPO.StaticPermissionId(SubjectType.ROLE, roleId,
                    ACLPermissions.ALL.resource, ACLPermissions.ALL.action))
            }
        }
        val aclEntries = aclRepository.findAllById(ids)
        return aclEntries.isNotEmpty()
    }

    override fun checkPolicyPermission(context: ABACContext) {
        var provider: ABACAuthenticationProvider? = null
        for (pro in providers) {
            if (pro.isSupport(context::class.java)) {
                provider = pro
            }
        }
        provider ?: throw IllegalStateException("No provider suitable for context class '${context::class}'")

        val principal = SecurityContextHolder.getContext().authentication.principal
        if (principal !is UserWithID) {
            throw NamedExceptions.FORBIDDEN.toException()
        }
        val user = userRepository.findById(principal.id).getOrNull()?.toDTO() ?: throw NamedExceptions.FORBIDDEN.toException()
        val spelContext = provider.toContextMap(context)
        spelContext.put("user", user)
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
        var isEmpty = true
        for (roleId in roleIds) {
            val policies =
                policyPermissionRepository.findAllBySubjectTypeAndSubjectIdAndResourceAndAction(
                    SubjectType.ROLE,
                    roleId,
                    permissionEntity.resource,
                    permissionEntity.action
                )

            if (policies.isNotEmpty()) {
                isEmpty = false
            }
            for (policy in policies) {
                val expressionString = policy.conditionExpression!!

                val expression = expressionCache.compute(expressionString) {k, v ->
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
                val result = try {
                    expression.getValue(context, Boolean::class.java)
                } catch (e: Exception) {
                    logger.error("", e)
                    throw BusinessException("SpEL 脚本执行错误，请联系管理员")
                }
                if (result == null || !result) {
                    return false
                }
                for (plugin in policy.enhancePlugins) {
                    val ext = policyAuthenticationExtManager.getById(plugin.pluginId)

                    if (!ext.hasPermission(
                            spELContext,
                            objectMapper.readValue(plugin.configuration, ext.getConfigurationClass())
                        )
                    ) {
                        return false
                    }
                }
                return true
            }
        }
        return isEmpty
    }



}