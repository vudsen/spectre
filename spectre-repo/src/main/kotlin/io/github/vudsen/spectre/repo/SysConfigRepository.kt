package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.po.SysConfigPO
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
interface SysConfigRepository : JpaRepository<SysConfigPO, Long>, QueryByExampleExecutor<SysConfigPO> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(
        """
        UPDATE SysConfigPO s
        SET s.value = :newValue
        WHERE s.id = :id
          AND ((:expectedOldValue IS NULL AND s.value IS NULL) OR s.value = :expectedOldValue)
        """
    )
    fun updateValueByIdWithOptimisticCheck(
        @Param("id") id: Long,
        @Param("expectedOldValue") expectedOldValue: String?,
        @Param("newValue") newValue: String,
    ): Int

    @Modifying
    @Query("UPDATE SysConfigPO s SET s.value = :value WHERE s.id = :id")
    fun updateValueById(@Param("id") id: Long, @Param("value") value: String)

}
