package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.api.dto.UserDTO
import io.github.vudsen.spectre.api.dto.UserDTO.Companion.toDTO
import io.github.vudsen.spectre.api.exception.BusinessException
import io.github.vudsen.spectre.repo.UserRepository
import io.github.vudsen.spectre.api.service.UserService
import io.github.vudsen.spectre.repo.po.UserPO
import io.github.vudsen.spectre.repo.util.RepoConstant
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
    override fun saveUser(userPO: UserPO) {
        val id = userPO.id
        if (id == RepoConstant.EMPTY_ID) {
            userPO.password = passwordEncoder.encode(userPO.password)!!
            userRepository.save(userPO)
            return
        }
        val builder = entityManager.criteriaBuilder
        val criteria = builder.createCriteriaUpdate(UserPO::class.java)

        val root = criteria.from(UserPO::class.java)
        userPO.displayName ?.let {
            criteria.set(root.get("displayName"), it)
        }
        userPO.labels ?.let {
            criteria.set(root.get("labels"), it)
        }

        criteria.where(builder.equal(root.get<Long>("id"), id))
        entityManager.createQuery(criteria).executeUpdate()
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

    override fun findById(id: Long): UserDTO? {
        return userRepository.findById(id).getOrNull()?.toDTO().apply {
            this?.password = ""
        }
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
        val user = userRepository.findById(userId).getOrNull()?.toDTO() ?: throw BusinessException("用户不存在")
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