package io.github.vudsen.spectre.core.integrate

import org.springframework.security.core.userdetails.User


class UserWithID(val id: Long, username: String, password: String) : User(username, password, emptyList())