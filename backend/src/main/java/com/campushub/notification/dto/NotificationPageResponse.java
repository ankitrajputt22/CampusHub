package com.campushub.notification.dto;

import java.time.Instant;
import java.util.List;

public record NotificationPageResponse(
        NotificationStats stats,
        List<NotificationItem> notifications,
        PaginationSummary pagination
) {

    public record NotificationStats(
            long totalNotifications,
            long unreadNotifications,
            long orderNotifications,
            long paymentNotifications,
            long reviewNotifications,
            long systemNotifications
    ) {
    }

    public record NotificationItem(
            Long id,
            String title,
            String message,
            String notificationType,
            String priority,
            String relatedEntityType,
            Long relatedEntityId,
            String actionUrl,
            boolean isRead,
            Instant readAt,
            Instant createdAt
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
