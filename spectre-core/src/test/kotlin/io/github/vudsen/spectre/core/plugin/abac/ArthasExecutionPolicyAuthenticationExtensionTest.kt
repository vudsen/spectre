package io.github.vudsen.spectre.core.plugin.abac

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.api.dto.RuntimeNodeDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.api.perm.ABACPermissions
import io.github.vudsen.spectre.api.plugin.rnode.Jvm
import io.github.vudsen.spectre.api.service.AppAccessControlService
import io.github.vudsen.spectre.api.service.PolicyPermissionService
import io.github.vudsen.spectre.api.service.RuntimeNodeService
import io.github.vudsen.spectre.core.integrate.abac.ArthasExecutionABACContext
import io.github.vudsen.spectre.core.plugin.abac.ArthasExecutionPolicyAuthenticationExtension.ArthasExecutionConfiguration
import io.github.vudsen.spectre.repo.entity.PolicyPermissionEnhancePlugin
import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.PolicyPermissionPO
import io.github.vudsen.spectre.test.AbstractSpectreTest
import io.github.vudsen.spectre.test.TestConstant
import io.github.vudsen.spectre.test.plugin.AttachTester
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired

class ArthasExecutionPolicyAuthenticationExtensionTest : AbstractSpectreTest() {

    @set:Autowired
    lateinit var appAccessControlService: AppAccessControlService

    @set:Autowired
    lateinit var policyPermissionService: PolicyPermissionService

    @set:Autowired
    lateinit var runtimeNodeService: RuntimeNodeService


    @set:Autowired
    lateinit var attachTester: AttachTester

    private fun checkPermission(command: List<String>, runtimeNodeDTO: RuntimeNodeDTO, jvm: Jvm) {
        val context = ArthasExecutionABACContext(
            ABACPermissions.RUNTIME_NODE_ARTHAS_EXECUTE,
            command,
            runtimeNodeDTO,
            jvm
        )
        appAccessControlService.checkPolicyPermission(context)
    }

    @Test
    fun `test redirect operator`() {
        val objectMapper = ObjectMapper()
        // setup permission
        val id = policyPermissionService.save(PolicyPermissionPO().apply {
            subjectType = SubjectType.ROLE
            subjectId = TestConstant.ROLE_TEST_ID
            resource = ABACPermissions.RUNTIME_NODE_ARTHAS_EXECUTE.resource
            action = ABACPermissions.RUNTIME_NODE_ARTHAS_EXECUTE.action
            conditionExpression = "'true'"
            enhancePlugins = listOf(PolicyPermissionEnhancePlugin().apply {
                pluginId = ArthasExecutionPolicyAuthenticationExtension.ID
                configuration = objectMapper.writeValueAsString(ArthasExecutionConfiguration().apply {
                    allowedCommands = setOf("watch")
                    allowRedirect = false
                })
            })
        }).id!!
        try {
            setupSecurityContext(TestConstant.USER_TESTER_USERNAME, TestConstant.USER_TESTER_PASSWORD)

            val runtimeNodeDTO = runtimeNodeService.findPureRuntimeNodeById(attachTester.commonRuntimeNodeId)!!
            val jvm = runtimeNodeService.deserializeToJvm(
                runtimeNodeDTO.pluginId,
                runtimeNodeService.findTreeNode(attachTester.resolveDefaultJvm().id)!!
            )

            checkPermission(listOf("watch", "foo.Bar", "'#cost>200'"), runtimeNodeDTO, jvm)
            Assertions.assertThrows(BusinessException::class.java) {
                checkPermission(listOf("watch", "foo.Bar", ">", "test.txt"), runtimeNodeDTO, jvm)
            }
            Assertions.assertThrows(BusinessException::class.java) {
                checkPermission(listOf("trace", "foo.Bar"), runtimeNodeDTO, jvm)
            }
        } finally {
            policyPermissionService.deletePermission(id)
        }

    }


}