package io.github.vudsen.spectre.repo

import io.github.vudsen.spectre.repo.entity.SubjectType
import io.github.vudsen.spectre.repo.po.StaticPermissionPO
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.QueryByExampleExecutor
import org.springframework.stereotype.Repository

@Repository
interface StaticPermissionRepository :
    JpaRepository<StaticPermissionPO, StaticPermissionPO.StaticPermissionId>,
    QueryByExampleExecutor<StaticPermissionPO> {


    fun findAllByIdSubjectTypeAndIdSubjectId(
        subjectType: SubjectType,
        subjectId: Long,
        pageable: Pageable
    ): Page<StaticPermissionPO>

    fun findAllByIdSubjectTypeAndIdSubjectIdAndIdResource(
        subjectType: SubjectType,
        subjectId: Long,
        resource: String
    ): List<StaticPermissionPO>


}