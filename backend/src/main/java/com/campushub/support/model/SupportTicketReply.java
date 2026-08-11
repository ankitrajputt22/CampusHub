package com.campushub.support.model;

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
@Table(name = "support_ticket_replies")
public class SupportTicketReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private SupportTicket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private SupportSenderType senderType;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(name = "is_internal_note", nullable = false)
    private boolean internalNote;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SupportTicketReply() {
    }

    public SupportTicketReply(
            SupportTicket ticket,
            User sender,
            SupportSenderType senderType,
            String message,
            boolean internalNote
    ) {
        this.ticket = ticket;
        this.sender = sender;
        this.senderType = senderType;
        this.message = message;
        this.internalNote = internalNote;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public Long getId() { return id; }
    public SupportTicket getTicket() { return ticket; }
    public User getSender() { return sender; }
    public SupportSenderType getSenderType() { return senderType; }
    public String getMessage() { return message; }
    public boolean isInternalNote() { return internalNote; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
