package io.github.vudsen.spectre.api.service

import io.github.vudsen.spectre.api.dto.CreateUserDTO
import io.github.vudsen.spectre.api.dto.UpdateUserDTO
import io.github.vudsen.spectre.repo.po.UserPO
import org.springframework.data.domain.Page

interface UserService {

    /**
     * 列出所有用户
     */
    fun listUsers(page: Int, size: Int): Page<UserPO>


    /**
     * 创建用户
     */
    fun createUser(userDTO: CreateUserDTO): UserPO

    /**
     * 更新用户
     */
    fun updateUser(userDTO: UpdateUserDTO)

    /**
     * 登录
     * @return 用户id
     */
    fun findByUsernameAndPassword(username: String, password: String): Long?

    /**
     * 根据用户名前缀搜索
     */
    fun searchByUsernamePrefix(usernamePrefix: String): Page<UserPO>

    /**
     * 根据 id 查询用户
     */
    fun findById(id: Long): UserPO?

    /**
     * 修改用户密码, 但是不校验原密码
     */
    fun modifyPassword(userId: Long, newPassword: String)

    /**
     * 修改用户密码
     */
    fun modifyPassword(userId: Long, oldPassword: String, newPassword: String)

    fun deleteUserById(userId: Long)
}