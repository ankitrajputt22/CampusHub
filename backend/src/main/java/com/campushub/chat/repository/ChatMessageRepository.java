package com.campushub.chat.repository;

import com.campushub.chat.model.ChatMessage;
import com.campushub.chat.model.ChatMessageStatus;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @EntityGraph(attributePaths = {"sender", "receiver"})
    Page<ChatMessage> findByConversationIdAndDeletedFalseOrderByCreatedAtDesc(
            Long conversationId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"conversation", "sender", "receiver"})
    @Query("select message from ChatMessage message where message.id = :messageId")
    Optional<ChatMessage> findReportableById(@Param("messageId") Long messageId);

    Optional<ChatMessage> findTopByConversationIdAndDeletedFalseOrderByCreatedAtDesc(
            Long conversationId
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update ChatMessage message
            set message.status = :readStatus,
                message.readAt = :readAt,
                message.updatedAt = :readAt
            where message.conversation.id = :conversationId
              and message.receiver.id = :userId
              and message.status <> :readStatus
              and message.deleted = false
            """)
    int markReceivedMessagesRead(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId,
            @Param("readStatus") ChatMessageStatus readStatus,
            @Param("readAt") Instant readAt
    );
}
