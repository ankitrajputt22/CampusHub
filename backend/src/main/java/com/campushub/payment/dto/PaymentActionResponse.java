package com.campushub.payment.dto;

import java.time.Instant;

public record PaymentActionResponse(
        Long orderId,
        Long paymentId,
        String orderStatus,
        String paymentStatus,
        String failureReason,
        Instant updatedAt
) {
}
