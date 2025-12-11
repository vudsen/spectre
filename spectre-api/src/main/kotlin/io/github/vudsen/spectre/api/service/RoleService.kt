package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.repo.po.RolePO
import io.github.vudsen.spectre.repo.po.UserPO
import org.springframework.data.domain.Page

interface RoleService {

    /**
     * 保存角色
     */
    fun saveRole(role: RolePO)

    /**
     * 根据 id 查找角色
     */
    fun findById(id: Long): RolePO?

    /**
     * 获取已经绑定的用户
     */
    fun boundUsers(roleId: Long, page: Int, size: Int): Page<UserPO>

    /**
     * 将角色绑定到用户
     */
    fun bindUser(roleIds: List<Long>, userIds: List<Long>)

    /**
     * 解绑用户
     */
    fun unbindUser(roleId: Long, userId: Long)

    /**
     * 列出角色
     */
    fun listRoles(page: Int, size: Int): Page<RolePO>

    /**
     * 列出用户的角色
     */
    fun listUserRoles(userId: Long): List<RolePO>

    /**
     * 根据名称搜素角色
     */
    fun searchByName(name: String, page: Int, size: Int): Page<RolePO>

}