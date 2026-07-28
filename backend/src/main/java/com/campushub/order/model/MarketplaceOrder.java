package com.campushub.order.model;

import com.campushub.listing.model.Listing;
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
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Entity
@Table(name = "marketplace_orders")
public class MarketplaceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 40)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus;

    @Column(name = "pickup_location", nullable = false, length = 160)
    private String pickupLocation;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MarketplaceOrder() {
    }

    public MarketplaceOrder(Listing listing, User buyer, User seller, OrderStatus status) {
        Instant now = Instant.now();
        this.orderNumber = "CH-ORD-"
                + DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC).format(now)
                + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.listing = listing;
        this.buyer = buyer;
        this.seller = seller;
        this.status = status;
        this.amount = listing.getPrice();
        this.pickupLocation = listing.getPickupLocation();
        this.paymentStatus = switch (status) {
            case PAID, READY_FOR_PICKUP, COMPLETED, CONFIRMED -> PaymentStatus.SUCCESS;
            case REFUNDED -> PaymentStatus.REFUNDED;
            case PAYMENT_FAILED -> PaymentStatus.FAILED;
            default -> PaymentStatus.PENDING;
        };
        if (this.paymentStatus == PaymentStatus.SUCCESS) {
            this.paidAt = now;
        }
        if (status == OrderStatus.COMPLETED) {
            this.completedAt = now;
        }
        if (status == OrderStatus.CANCELLED) {
            this.cancelledAt = now;
        }
        this.createdAt = now;
        this.updatedAt = this.createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public Listing getListing() {
        return listing;
    }

    public User getBuyer() {
        return buyer;
    }

    public User getSeller() {
        return seller;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void cancel() {
        this.status = OrderStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        this.updatedAt = this.cancelledAt;
    }

    public void markReadyForPickup() {
        this.status = OrderStatus.READY_FOR_PICKUP;
        this.updatedAt = Instant.now();
    }

    public void confirmPickup() {
        this.status = OrderStatus.COMPLETED;
        this.completedAt = Instant.now();
        this.updatedAt = this.completedAt;
    }

    public void markPaid() {
        this.status = OrderStatus.PAID;
        this.paymentStatus = PaymentStatus.SUCCESS;
        this.paidAt = Instant.now();
        this.updatedAt = this.paidAt;
    }

    public void markPaymentFailed() {
        this.status = OrderStatus.PAYMENT_FAILED;
        this.paymentStatus = PaymentStatus.FAILED;
        this.updatedAt = Instant.now();
    }

    public void resetPaymentPending() {
        this.status = OrderStatus.PENDING_PAYMENT;
        this.paymentStatus = PaymentStatus.PENDING;
        this.updatedAt = Instant.now();
    }
}
