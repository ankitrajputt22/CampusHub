package com.campushub.support.repository;

import com.campushub.support.model.SupportTicketAttachment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportTicketAttachmentRepository
        extends JpaRepository<SupportTicketAttachment, Long> {

    List<SupportTicketAttachment> findAllByTicketIdOrderByCreatedAtAscIdAsc(Long ticketId);

    @Override
    @EntityGraph(attributePaths = {"ticket", "ticket.user"})
    Optional<SupportTicketAttachment> findById(Long id);
}
