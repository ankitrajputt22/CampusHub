package com.campushub.order.dto;

import com.campushub.order.dto.OrdersPageResponse.ListingSummary;
import com.campushub.order.dto.OrdersPageResponse.OtherPartySummary;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDetailsResponse(
        Long id,
        String orderNumber,
        String role,
        String status,
        String paymentStatus,
        BigDecimal amount,
        String pickupLocation,
        Instant createdAt,
        Instant updatedAt,
        Instant paidAt,
        Instant completedAt,
        Instant cancelledAt,
        ListingSummary listing,
        OtherPartySummary otherParty,
        List<TimelineEntry> timeline,
        List<String> availableActions
) {

    public record TimelineEntry(
            String status,
            String note,
            Instant createdAt
    ) {
    }
}
