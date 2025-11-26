package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.UserPO
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : JpaRepository<UserPO, Long>, QueryByExampleExecutor<UserPO> {

    fun findByUsernameAndPassword(username: String, password: String): UserPO?

    fun findByUsername(username: String): UserPO?

    fun searchByUsernameStartsWith(usernamePrefix: String, page: Pageable): Page<UserPO>

}