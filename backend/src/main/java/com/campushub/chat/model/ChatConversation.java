package com.campushub.chat.model;

import com.campushub.college.model.College;
import com.campushub.listing.model.Listing;
import com.campushub.order.model.MarketplaceOrder;
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
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Entity
@Table(name = "chat_conversations")
public class ChatConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_number", nullable = false, unique = true, length = 40)
    private String conversationNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private MarketplaceOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "college_id", nullable = false)
    private College college;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ConversationStatus status;

    @Column(name = "last_message_id")
    private Long lastMessageId;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ChatConversation() {
    }

    public ChatConversation(Listing listing, MarketplaceOrder order, User buyer, User seller) {
        Instant now = Instant.now();
        this.conversationNumber = "CH-CHAT-"
                + DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC).format(now)
                + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.listing = listing;
        this.order = order;
        this.buyer = buyer;
        this.seller = seller;
        this.college = listing.getCollege();
        this.status = ConversationStatus.ACTIVE;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public Long getId() { return id; }
    public String getConversationNumber() { return conversationNumber; }
    public Listing getListing() { return listing; }
    public MarketplaceOrder getOrder() { return order; }
    public User getBuyer() { return buyer; }
    public User getSeller() { return seller; }
    public College getCollege() { return college; }
    public ConversationStatus getStatus() { return status; }
    public Long getLastMessageId() { return lastMessageId; }
    public Instant getLastMessageAt() { return lastMessageAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void linkOrder(MarketplaceOrder order) {
        if (this.order == null) {
            this.order = order;
            this.updatedAt = Instant.now();
        }
    }

    public void recordMessage(Long messageId, Instant sentAt) {
        this.lastMessageId = messageId;
        this.lastMessageAt = sentAt;
        this.updatedAt = sentAt;
    }
}
