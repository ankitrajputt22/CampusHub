package com.campushub.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentVerificationResponse(
        boolean verified,
        VerifiedOrder order,
        VerifiedPayment payment,
        VerifiedListing listing
) {

    public record VerifiedOrder(
            Long id,
            String orderNumber,
            String orderStatus,
            String paymentStatus,
            BigDecimal amount
    ) {
    }

    public record VerifiedPayment(
            Long id,
            String razorpayPaymentId,
            String razorpayOrderId,
            String status,
            Instant paidAt
    ) {
    }

    public record VerifiedListing(
            Long id,
            String status
    ) {
    }
}
