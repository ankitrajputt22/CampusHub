package com.campushub.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrdersPageResponse(
        OrderStats stats,
        List<OrderSummary> orders,
        PaginationSummary pagination
) {

    public record OrderStats(
            long totalOrders,
            long pendingPayment,
            long paidOrders,
            long readyForPickup,
            long completedOrders,
            long cancelledOrders
    ) {
    }

    public record OrderSummary(
            Long id,
            String orderNumber,
            String role,
            String status,
            String paymentStatus,
            BigDecimal amount,
            Instant createdAt,
            Instant updatedAt,
            String pickupLocation,
            ListingSummary listing,
            OtherPartySummary otherParty,
            List<String> availableActions
    ) {
    }

    public record ListingSummary(
            Long id,
            String title,
            String category,
            String condition,
            String coverImageUrl
    ) {
    }

    public record OtherPartySummary(
            Long id,
            String fullName,
            String profilePhotoUrl,
            int trustScore,
            String trustLevel
    ) {
    }

    public record PaginationSummary(
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean hasMore
    ) {
    }
}
