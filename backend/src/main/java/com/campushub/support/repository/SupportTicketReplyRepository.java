package com.campushub.support.repository;

import com.campushub.support.model.SupportTicketReply;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportTicketReplyRepository extends JpaRepository<SupportTicketReply, Long> {

    @EntityGraph(attributePaths = "sender")
    List<SupportTicketReply> findAllByTicketIdAndInternalNoteFalseOrderByCreatedAtAscIdAsc(
            Long ticketId
    );

    @EntityGraph(attributePaths = "sender")
    List<SupportTicketReply> findAllByTicketIdOrderByCreatedAtAscIdAsc(Long ticketId);
}
