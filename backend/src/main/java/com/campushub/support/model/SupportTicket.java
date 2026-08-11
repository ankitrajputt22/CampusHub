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
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "support_tickets")
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_number", nullable = false, unique = true, length = 32)
    private String ticketNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "guest_name", length = 120)
    private String guestName;

    @Column(name = "guest_email", length = 254)
    private String guestEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private SupportCategory category;

    @Column(nullable = false, length = 120)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SupportStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupportPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "related_entity_type", nullable = false, length = 30)
    private SupportRelatedEntityType relatedEntityType;

    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_admin_id")
    private User assignedAdmin;

    @Column(name = "last_reply_by", nullable = false, length = 20)
    private String lastReplyBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    protected SupportTicket() {
    }

    private SupportTicket(
            User user,
            String guestName,
            String guestEmail,
            SupportCategory category,
            String subject,
            String description,
            SupportPriority priority,
            SupportRelatedEntityType relatedEntityType,
            Long relatedEntityId
    ) {
        this.ticketNumber = "SUP-" + UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase(Locale.ROOT);
        this.user = user;
        this.guestName = guestName;
        this.guestEmail = guestEmail;
        this.category = category;
        this.subject = subject;
        this.description = description;
        this.status = SupportStatus.OPEN;
        this.priority = priority;
        this.relatedEntityType = relatedEntityType == null
                ? SupportRelatedEntityType.NONE
                : relatedEntityType;
        this.relatedEntityId = relatedEntityId;
        this.lastReplyBy = user == null ? SupportSenderType.GUEST.name() : SupportSenderType.STUDENT.name();
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public static SupportTicket forStudent(
            User user,
            SupportCategory category,
            String subject,
            String description,
            SupportPriority priority,
            SupportRelatedEntityType relatedEntityType,
            Long relatedEntityId
    ) {
        return new SupportTicket(
                user, null, null, category, subject, description, priority,
                relatedEntityType, relatedEntityId
        );
    }

    public static SupportTicket forGuest(
            String guestName,
            String guestEmail,
            SupportCategory category,
            String subject,
            String description,
            SupportPriority priority
    ) {
        return new SupportTicket(
                null, guestName, guestEmail, category, subject, description,
                priority, SupportRelatedEntityType.NONE, null
        );
    }

    public void recordReply(SupportSenderType senderType) {
        this.lastReplyBy = senderType.name();
        this.updatedAt = Instant.now();
    }

    public void transitionTo(SupportStatus nextStatus) {
        this.status = nextStatus;
        this.updatedAt = Instant.now();
        if (nextStatus == SupportStatus.RESOLVED) {
            this.resolvedAt = this.updatedAt;
        } else if (nextStatus != SupportStatus.CLOSED) {
            this.resolvedAt = null;
        }
        if (nextStatus == SupportStatus.CLOSED) {
            this.closedAt = this.updatedAt;
        } else {
            this.closedAt = null;
        }
    }

    public void assignTo(User admin) {
        this.assignedAdmin = admin;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getTicketNumber() { return ticketNumber; }
    public User getUser() { return user; }
    public String getGuestName() { return guestName; }
    public String getGuestEmail() { return guestEmail; }
    public SupportCategory getCategory() { return category; }
    public String getSubject() { return subject; }
    public String getDescription() { return description; }
    public SupportStatus getStatus() { return status; }
    public SupportPriority getPriority() { return priority; }
    public SupportRelatedEntityType getRelatedEntityType() { return relatedEntityType; }
    public Long getRelatedEntityId() { return relatedEntityId; }
    public User getAssignedAdmin() { return assignedAdmin; }
    public String getLastReplyBy() { return lastReplyBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public Instant getClosedAt() { return closedAt; }
}
