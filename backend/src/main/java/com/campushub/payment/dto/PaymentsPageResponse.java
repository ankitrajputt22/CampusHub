package com.campushub.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PaymentsPageResponse(
        PaymentStats stats,
        List<PaymentSummary> payments,
        PaginationSummary pagination
) {

    public record PaymentStats(
            long totalPayments,
            long successfulPayments,
            long pendingPayments,
            long failedPayments,
            long refundedPayments,
            BigDecimal totalSpent
    ) {
    }

    public record PaymentSummary(
            Long id,
            Long orderId,
            String orderNumber,
            String role,
            Long listingId,
            String productTitle,
            String coverImageUrl,
            BigDecimal amount,
            String currency,
            String paymentStatus,
            String orderStatus,
            String paymentMethod,
            String razorpayPaymentId,
            String refundStatus,
            String failureReason,
            Instant paymentDate,
            Instant createdAt,
            boolean canRetry
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
