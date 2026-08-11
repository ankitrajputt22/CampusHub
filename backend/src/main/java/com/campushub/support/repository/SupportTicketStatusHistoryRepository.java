package com.campushub.support.repository;

import com.campushub.support.model.SupportTicketStatusHistory;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportTicketStatusHistoryRepository
        extends JpaRepository<SupportTicketStatusHistory, Long> {

    @EntityGraph(attributePaths = "changedBy")
    List<SupportTicketStatusHistory> findAllByTicketIdOrderByCreatedAtAscIdAsc(Long ticketId);
}
