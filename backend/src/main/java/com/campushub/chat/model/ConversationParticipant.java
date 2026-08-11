package com.campushub.chat.model;

import com.campushub.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "chat_conversation_participants")
public class ConversationParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ChatConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "participant_role", nullable = false, length = 20)
    private ConversationParticipantRole role;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    @Column(name = "unread_count", nullable = false)
    private int unreadCount;

    @Column(name = "is_archived", nullable = false)
    private boolean archived;

    @Column(name = "is_muted", nullable = false)
    private boolean muted;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ConversationParticipant() {
    }

    public ConversationParticipant(
            ChatConversation conversation,
            User user,
            ConversationParticipantRole role
    ) {
        this.conversation = conversation;
        this.user = user;
        this.role = role;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public Long getId() { return id; }
    public ChatConversation getConversation() { return conversation; }
    public User getUser() { return user; }
    public ConversationParticipantRole getRole() { return role; }
    public Long getLastReadMessageId() { return lastReadMessageId; }
    public Instant getLastReadAt() { return lastReadAt; }
    public int getUnreadCount() { return unreadCount; }
    public boolean isArchived() { return archived; }
    public boolean isMuted() { return muted; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void incrementUnread() {
        this.unreadCount++;
        this.updatedAt = Instant.now();
    }

    public void markRead(Long messageId, Instant readAt) {
        this.lastReadMessageId = messageId;
        this.lastReadAt = readAt;
        this.unreadCount = 0;
        this.updatedAt = readAt;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
        this.updatedAt = Instant.now();
    }
}
