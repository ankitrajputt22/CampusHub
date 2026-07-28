package com.campushub.notification.dto;

import java.time.Instant;

public record NotificationsMarkedReadResponse(
        int updatedCount,
        long unreadCount,
        Instant updatedAt
) {
}
