package io.github.vudsen.spectre.core.service.impl

import io.github.vudsen.spectre.core.integrate.UserWithID
import io.github.vudsen.spectre.repo.UserRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class UserDetailsServiceImpl(
    private val userRepository: UserRepository
) : UserDetailsService {


    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findByUsername(username) ?: throw UsernameNotFoundException("用户不存在")

        return UserWithID(user.id!!, username, user.password!!)
    }

}