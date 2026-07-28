package com.campushub.payment.model;

import com.campushub.college.model.College;
import com.campushub.listing.model.Listing;
import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.model.PaymentStatus;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private MarketplaceOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "college_id", nullable = false)
    private College college;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "razorpay_order_id", nullable = false, unique = true, length = 100)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", unique = true, length = 100)
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature", length = 255)
    private String razorpaySignature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    @Column(name = "payment_method", length = 40)
    private String paymentMethod;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", nullable = false, length = 30)
    private RefundStatus refundStatus;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Payment() {
    }

    public Payment(MarketplaceOrder order, String razorpayOrderId, String currency) {
        this.order = order;
        this.buyer = order.getBuyer();
        this.seller = order.getSeller();
        this.listing = order.getListing();
        this.college = order.getListing().getCollege();
        this.amount = order.getAmount();
        this.currency = currency;
        this.razorpayOrderId = razorpayOrderId;
        this.status = PaymentStatus.PENDING;
        this.refundStatus = RefundStatus.NOT_REQUIRED;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public Long getId() {
        return id;
    }

    public MarketplaceOrder getOrder() {
        return order;
    }

    public User getBuyer() {
        return buyer;
    }

    public User getSeller() {
        return seller;
    }

    public Listing getListing() {
        return listing;
    }

    public College getCollege() {
        return college;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public RefundStatus getRefundStatus() {
        return refundStatus;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void beginAttempt(String newRazorpayOrderId) {
        this.razorpayOrderId = newRazorpayOrderId;
        this.razorpayPaymentId = null;
        this.razorpaySignature = null;
        this.paymentMethod = null;
        this.failureReason = null;
        this.status = PaymentStatus.PENDING;
        this.updatedAt = Instant.now();
    }

    public void markSuccessful(String paymentId, String signature) {
        this.razorpayPaymentId = paymentId;
        this.razorpaySignature = signature;
        this.status = PaymentStatus.SUCCESS;
        this.failureReason = null;
        this.paidAt = Instant.now();
        this.updatedAt = this.paidAt;
    }

    public void markFailed(String paymentId, String reason) {
        this.razorpayPaymentId = paymentId;
        this.status = PaymentStatus.FAILED;
        this.failureReason = reason;
        this.updatedAt = Instant.now();
    }
}
