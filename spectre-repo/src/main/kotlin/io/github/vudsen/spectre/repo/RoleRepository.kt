package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.RolePO
import io.github.vudsen.spectre.repo.po.UserPO
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository

@Repository
interface RoleRepository : JpaRepository<RolePO, Long>, QueryByExampleExecutor<RolePO> {

    @Modifying
    @Query("INSERT INTO user_role(user_id, role_id) VALUES(:userId, :roleId)", nativeQuery = true)
    fun bindRoleToUser(@Param("userId") userId: Long, @Param("roleId") roleId: Long)

    @Query("SELECT role_id FROM user_role WHERE user_id = ?", nativeQuery = true)
    fun findUserRoleIds(@Param("userId") userId: Long): List<Long>

    @Query("SELECT r FROM RolePO r WHERE r.id IN (SELECT ur.id.roleId FROM UserRolePO ur WHERE ur.id.userId = :userId)")
    fun queryAllUserRoles(@Param("userId") userId: Long): List<RolePO>

    @Query("SELECT COUNT(*) FROM user_role WHERE role_id = :roleId AND user_id = :userId ", nativeQuery = true)
    fun countRoleRelationByRoleIdAndUserId(@Param("roleId") roleId: Long, @Param("userId") userId: Long): Int

    @Query("SELECT u FROM UserRolePO ur JOIN UserPO u ON u.id = ur.id.userId WHERE ur.id.roleId = :roleId")
    fun findUsersByRoleId(@Param("roleId") roleId: Long, pageable: Pageable): Page<UserPO>

    @Modifying
    @Query("DELETE FROM UserRolePO WHERE id.userId = :userId AND id.roleId = :roleId")
    fun unbindUser(@Param("roleId") roleId: Long, @Param("userId") userId: Long)

    @Modifying
    @Query("DELETE FROM UserRolePO WHERE id.roleId = :roleId")
    fun deleteUserRoleByRoleId(@Param("roleId") roleId: Long)

    fun searchByNameStartsWith(namePrefix: String, page: Pageable): Page<RolePO>

}