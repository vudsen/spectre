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

    companion object {
        const val ADMIN_ROLE = 1L
        const val ADMIN_ID = 1L
    }

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
    override fun bindUser(roleIds: List<Long>, userIds: List<Long>) {
        for (roleId in roleIds) {
            val role = roleRepository.findById(roleId).getOrNull() ?: throw BusinessException("error.role.not.exit")
            for (uid in userIds) {
                val user = userRepository.findById(uid).getOrNull() ?: throw BusinessException("error.user.not.exit")

                if (roleRepository.countRoleRelationByRoleIdAndUserId(roleId, uid) != 0) {
                    throw BusinessException("error.role.already.bound.user", arrayOf(user.username, role.name))
                }
                roleRepository.bindRoleToUser(uid, roleId)
            }
        }
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun unbindUser(roleId: Long, userId: Long) {
        if (roleId == ADMIN_ROLE && userId == ADMIN_ID) {
            throw BusinessException("error.cannot.unbind.admin")
        }
        roleRepository.unbindUser(roleId, userId)
    }

    override fun listRoles(
        page: Int,
        size: Int
    ): Page<RolePO> {
        return roleRepository.findAll(PageRequest.of(page, size))
    }

    override fun listUserRoles(userId: Long): List<RolePO> {
        return roleRepository.queryAllUserRoles(userId)
    }

    override fun searchByName(name: String, page: Int, size: Int): Page<RolePO> {
        return roleRepository.searchByNameStartsWith(name, PageRequest.of(page, size))
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun deleteRole(id: Long) {
        roleRepository.deleteById(id)
        roleRepository.deleteUserRoleByRoleId(id)
    }


}