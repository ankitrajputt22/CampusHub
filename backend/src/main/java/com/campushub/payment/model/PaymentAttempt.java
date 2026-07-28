package com.campushub.payment.model;

import com.campushub.order.model.MarketplaceOrder;
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
@Table(name = "payment_attempts")
public class PaymentAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private MarketplaceOrder order;

    @Column(name = "razorpay_order_id", nullable = false, unique = true, length = 100)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentAttemptStatus status;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "attempted_at", nullable = false)
    private Instant attemptedAt;

    protected PaymentAttempt() {
    }

    public PaymentAttempt(MarketplaceOrder order, String razorpayOrderId) {
        this.order = order;
        this.razorpayOrderId = razorpayOrderId;
        this.status = PaymentAttemptStatus.CREATED;
        this.attemptedAt = Instant.now();
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public PaymentAttemptStatus getStatus() {
        return status;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public Instant getAttemptedAt() {
        return attemptedAt;
    }

    public void markSuccessful(String paymentId) {
        this.razorpayPaymentId = paymentId;
        this.status = PaymentAttemptStatus.SUCCESS;
        this.failureReason = null;
        this.attemptedAt = Instant.now();
    }

    public void markFailed(String paymentId, String reason) {
        this.razorpayPaymentId = paymentId;
        this.status = PaymentAttemptStatus.FAILED;
        this.failureReason = reason;
        this.attemptedAt = Instant.now();
    }

    public void markVerificationFailed(String paymentId) {
        this.razorpayPaymentId = paymentId;
        this.status = PaymentAttemptStatus.VERIFICATION_FAILED;
        this.failureReason = "Razorpay signature verification failed.";
        this.attemptedAt = Instant.now();
    }
}
