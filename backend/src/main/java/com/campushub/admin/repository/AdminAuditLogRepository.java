package com.campushub.admin.repository;

import com.campushub.admin.model.AdminAuditLog;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AdminAuditLogRepository
        extends JpaRepository<AdminAuditLog, Long>,
        JpaSpecificationExecutor<AdminAuditLog> {

    @EntityGraph(attributePaths = "admin")
    List<AdminAuditLog> findTop8ByOrderByCreatedAtDesc();

    @Override
    @EntityGraph(attributePaths = "admin")
    Page<AdminAuditLog> findAll(
            Specification<AdminAuditLog> specification,
            Pageable pageable
    );

    @EntityGraph(attributePaths = "admin")
    List<AdminAuditLog> findTop20ByTargetTypeAndTargetIdOrderByCreatedAtDesc(
            String targetType,
            Long targetId
    );

    @EntityGraph(attributePaths = "admin")
    List<AdminAuditLog> findTop20ByAdminIdOrderByCreatedAtDesc(Long adminId);

    long countByAdminId(Long adminId);
}
