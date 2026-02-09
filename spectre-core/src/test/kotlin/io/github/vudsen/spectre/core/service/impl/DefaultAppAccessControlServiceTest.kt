package io.github.vudsen.spectre.core.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.exception.PermissionDenyException
import io.github.vudsen.spectre.api.perm.AppPermissions
import io.github.vudsen.spectre.api.perm.PermissionEntity
import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.api.service.ArthasExecutionService
import io.github.vudsen.spectre.api.service.PolicyPermissionService
import io.github.vudsen.spectre.api.service.RoleService
import io.github.vudsen.spectre.api.service.UserService
import io.github.vudsen.spectre.core.plugin.abac.ArthasExecutionEnhancePolicyAuthenticationExtension
import io.github.vudsen.spectre.core.plugin.abac.ArthasExecutionEnhancePolicyAuthenticationExtension.ArthasExecutionConfiguration
import io.github.vudsen.spectre.repo.entity.PolicyPermissionEnhancePlugin
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.PolicyPermissionPO
import io.github.vudsen.spectre.repo.po.RolePO
import io.github.vudsen.spectre.repo.po.UserPO
import io.github.vudsen.spectre.test.AbstractSpectreTest
import io.github.vudsen.spectre.test.GlobalDisposer
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.plugin.AttachTester
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class DefaultAppAccessControlServiceTest : AbstractSpectreTest() {

    @set:Autowired
    lateinit var roleService: RoleService

    @set:Autowired
    lateinit var userService: UserService

    @set:Autowired
    lateinit var policyPermissionService: PolicyPermissionService

    @set:Autowired
    lateinit var appAccessControlService: AppAccessControlService

    @set:Autowired
    lateinit var arthasExecutionService: ArthasExecutionService

    @set:Autowired
    lateinit var attachTester: AttachTester

    private fun createRole(roleName: String): Long {
        val rolePO = RolePO().apply {
            name = roleName
        }
        roleService.saveRole(rolePO)

        GlobalDisposer.registerDispose {
            roleService.deleteRole(rolePO.id!!)
        }
        return rolePO.id!!
    }

    private fun createUser(username: String): Long {
        val userPO = UserPO().apply {
            this.username = username
            password = TestConstant.USER_TESTER_ENCRYPTED_PASSWORD
        }
        userService.saveUser(userPO)
        GlobalDisposer.registerDispose {
            userService.deleteUserById(userPO.id!!)
        }
        return userPO.id!!
    }

    private fun bindPolicyPermission(subjectId: Long, entity: PermissionEntity, plugins: List<PolicyPermissionEnhancePlugin> ): Long {
        val policyPermissionPO = PolicyPermissionPO().apply {
            subjectType = SubjectType.ROLE
            this.subjectId = subjectId
            resource = entity.resource
            action = entity.action
            this.conditionExpression = "true"
            enhancePlugins = plugins
        }
        policyPermissionService.save(policyPermissionPO)
        return policyPermissionPO.id!!
    }

    @Test
    fun checkPolicyPermission() {
        val username = "testmultirole"
        val testuser = createUser(username)

        val role1 = createRole("testrole1")
        val role2 = createRole("testrol2")

        roleService.bindUser(listOf(role1, role2), listOf(testuser))

        val objectMapper = ObjectMapper()
        bindPolicyPermission(
            role1,
            AppPermissions.RUNTIME_NODE_ARTHAS_EXECUTE,
            listOf(
                PolicyPermissionEnhancePlugin().apply {
                    pluginId = ArthasExecutionEnhancePolicyAuthenticationExtension.ID
                    configuration = objectMapper.writeValueAsString(ArthasExecutionConfiguration().apply {
                        allowedCommands = setOf("watch")
                    })
                }
            ))
        bindPolicyPermission(
            role2,
            AppPermissions.RUNTIME_NODE_ARTHAS_EXECUTE,
            listOf(
                PolicyPermissionEnhancePlugin().apply {
                    pluginId = ArthasExecutionEnhancePolicyAuthenticationExtension.ID
                    configuration = objectMapper.writeValueAsString(ArthasExecutionConfiguration().apply {
                        allowedCommands = setOf("trace")
                    })
                }
            ))

        bindPolicyPermission(role2, AppPermissions.RUNTIME_NODE_ATTACH, emptyList())

        setupSecurityContext(username, TestConstant.USER_TESTER_ENCRYPTED_PASSWORD)
        val defaultChannel = attachTester.resolveDefaultChannel()
        // assert no exception thrown
        arthasExecutionService.execAsync(defaultChannel, "watch demo.mathGame run -n 1")
        arthasExecutionService.execAsync(defaultChannel, "trace demo.mathGame run -n 1")
        Assertions.assertThrowsExactly(PermissionDenyException::class.java) {
            arthasExecutionService.execAsync(defaultChannel, "jad demo.mathGame")
        }
    }


}