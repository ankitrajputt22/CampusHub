package com.campushub.order.dto;

import java.time.Instant;

public record OrderActionResponse(
        Long orderId,
        String orderNumber,
        String status,
        String paymentStatus,
        Instant updatedAt,
        String message
) {
}
