package com.campushub.notification.dto;

import java.time.Instant;

public record NotificationReadResponse(
        Long id,
        boolean isRead,
        Instant readAt,
        long unreadCount
) {
}
