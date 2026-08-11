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
@Table(name = "support_ticket_status_history")
public class SupportTicketStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private SupportTicket ticket;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private SupportStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private SupportStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id")
    private User changedBy;

    @Column(name = "changed_by_role", nullable = false, length = 20)
    private String changedByRole;

    @Column(length = 500)
    private String note;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected SupportTicketStatusHistory() {
    }

    public SupportTicketStatusHistory(
            SupportTicket ticket,
            SupportStatus oldStatus,
            SupportStatus newStatus,
            User changedBy,
            String changedByRole,
            String note
    ) {
        this.ticket = ticket;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.changedByRole = changedByRole;
        this.note = note;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public SupportStatus getOldStatus() { return oldStatus; }
    public SupportStatus getNewStatus() { return newStatus; }
    public User getChangedBy() { return changedBy; }
    public String getChangedByRole() { return changedByRole; }
    public String getNote() { return note; }
    public Instant getCreatedAt() { return createdAt; }
}
