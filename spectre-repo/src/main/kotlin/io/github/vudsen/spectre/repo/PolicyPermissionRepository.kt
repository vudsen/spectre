package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.PolicyPermissionPO
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository

@Repository
interface PolicyPermissionRepository : JpaRepository<PolicyPermissionPO, Long>, QueryByExampleExecutor<PolicyPermissionPO> {

    fun findAllBySubjectTypeAndSubjectIdAndResourceAndAction(
        subjectType: SubjectType,
        subjectId: Long,
        resource: String,
        action: String
    ): List<PolicyPermissionPO>

    fun findAllBySubjectTypeAndSubjectId(subjectType: SubjectType, subjectId: Long, page: Pageable): Page<PolicyPermissionPO>

}