package com.campushub.chat.repository;

import com.campushub.chat.model.ConversationParticipant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationParticipantRepository
        extends JpaRepository<ConversationParticipant, Long> {

    Optional<ConversationParticipant> findByConversationIdAndUserId(
            Long conversationId,
            Long userId
    );

    List<ConversationParticipant> findAllByConversationIdInAndUserId(
            List<Long> conversationIds,
            Long userId
    );

    @Query("""
            select coalesce(sum(participant.unreadCount), 0)
            from ConversationParticipant participant
            where participant.user.id = :userId
            """)
    long sumUnreadCountByUserId(@Param("userId") Long userId);
}
