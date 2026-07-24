package com.campushub.order.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderInitiationResponse(
        Long orderId,
        Long listingId,
        String listingTitle,
        BigDecimal amount,
        String status,
        boolean paymentRequired,
        String nextStep,
        Instant createdAt
) {
}
