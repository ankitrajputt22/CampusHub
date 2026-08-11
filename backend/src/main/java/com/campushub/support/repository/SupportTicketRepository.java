package com.campushub.support.repository;

import com.campushub.support.model.SupportStatus;
import com.campushub.support.model.SupportTicket;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupportTicketRepository
        extends JpaRepository<SupportTicket, Long>, JpaSpecificationExecutor<SupportTicket> {

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, SupportStatus status);

    long countByStatus(SupportStatus status);

    @Override
    @EntityGraph(attributePaths = {"user", "user.college", "assignedAdmin"})
    Page<SupportTicket> findAll(Specification<SupportTicket> specification, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "user.college", "assignedAdmin"})
    @Query("select ticket from SupportTicket ticket where ticket.id = :id")
    Optional<SupportTicket> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"user", "user.college", "assignedAdmin"})
    @Query("""
            select ticket from SupportTicket ticket
            where ticket.id = :id and ticket.user.id = :userId
            """)
    Optional<SupportTicket> findDetailedByIdAndUserId(
            @Param("id") Long id,
            @Param("userId") Long userId
    );
}
