package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.CreateUserDTO
import io.github.vudsen.spectre.api.dto.UpdateUserDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.repo.UserRepository
import io.github.vudsen.spectre.api.service.UserService
import io.github.vudsen.spectre.repo.po.UserPO
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull


@Service
class DefaultUserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    @PersistenceContext
    private val entityManager: EntityManager
) : UserService {


    override fun listUsers(
        page: Int,
        size: Int
    ): Page<UserPO> {
        return userRepository.findAll(PageRequest.of(page, size))
    }


    @Transactional(rollbackFor = [Exception::class])
    override fun createUser(userDTO: CreateUserDTO): UserPO {
        val user = UserPO().apply {
            password = passwordEncoder.encode(userDTO.password)!!
            username = userDTO.username
            displayName = userDTO.displayName
            labels = userDTO.labels
        }
        userRepository.save(user)
        return user
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun updateUser(userDTO: UpdateUserDTO) {
        val userPO = userRepository.findById(userDTO.id).getOrNull() ?: throw BusinessException("error.user.not.exit")
        userDTO.password?.let {
            userPO.password = passwordEncoder.encode(it)!!
        }
        userDTO.labels?.let {
            userPO.labels = it
        }
        userDTO.displayName?.let {
            userPO.displayName = it
        }
        userRepository.save(userPO)
    }

    override fun findByUsernameAndPassword(username: String, password: String): Long? {
        return userRepository.findByUsernameAndPassword(
            username,
            passwordEncoder.encode(password)!!
        )?.id
    }

    override fun searchByUsernamePrefix(usernamePrefix: String): Page<UserPO> {
        return userRepository.searchByUsernameStartsWith(usernamePrefix, PageRequest.of(0, 10))
    }

    override fun findById(id: Long): UserPO? {
        return userRepository.findById(id).getOrNull()
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun modifyPassword(userId: Long, newPassword: String) {
        val builder = entityManager.criteriaBuilder
        val criteria = builder.createCriteriaUpdate(UserPO::class.java)

        val root = criteria.from(UserPO::class.java)
        criteria.set(root.get("id"), userId)
        criteria.set(root.get("password"), passwordEncoder.encode(newPassword))

        criteria.where(builder.equal(root.get<Long>("id"), userId))
        entityManager.createQuery(criteria).executeUpdate()
    }

    @Transactional(rollbackFor = [Exception::class])
    override fun modifyPassword(userId: Long, oldPassword: String, newPassword: String) {
        val user = userRepository.findById(userId).getOrNull() ?: throw BusinessException("error.user.not.exit")
        if (!passwordEncoder.matches(oldPassword, user.password)) {
            throw BusinessException("原密码不正确")
        }
        if (oldPassword == newPassword) {
            throw BusinessException("新旧密码不能一样")
        }

        modifyPassword(userId, newPassword)
    }

    override fun deleteUserById(userId: Long) {
        userRepository.deleteById(userId)
    }

}