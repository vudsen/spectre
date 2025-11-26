package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.repo.RoleRepository
import io.github.vudsen.spectre.api.service.RoleService
import io.github.vudsen.spectre.repo.UserRepository
import io.github.vudsen.spectre.repo.po.RolePO
import io.github.vudsen.spectre.repo.po.UserPO
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class DefaultRoleService(
    private val roleRepository: RoleRepository,
    private val userRepository: UserRepository
) : RoleService {

    override fun saveRole(role: RolePO) {
        roleRepository.save(role)
    }

    override fun findById(id: Long): RolePO? {
        return roleRepository.findById(id).getOrNull()
    }

    override fun boundUsers(
        roleId: Long,
        page: Int,
        size: Int
    ): Page<UserPO> {
        return roleRepository.findUsersByRoleId(roleId, PageRequest.of(page, size))
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun bindUser(roleId: Long, userIds: List<Long>) {
        for (uid in userIds) {
            val role = roleRepository.findById(roleId).getOrNull() ?: throw BusinessException("error.role.not.exit")
            val user = userRepository.findById(uid).getOrNull() ?: throw BusinessException("error.user.not.exit")

            if (roleRepository.countRoleRelationByRoleIdAndUserId(roleId, uid) != 0) {
                throw BusinessException("error.role.already.bound.user", arrayOf(user.username, role.name))
            }
            roleRepository.bindRoleToUser(uid, roleId)
        }
    }

    override fun listRoles(
        page: Int,
        size: Int
    ): Page<RolePO> {
        return roleRepository.findAll(PageRequest.of(page, size))
    }


}