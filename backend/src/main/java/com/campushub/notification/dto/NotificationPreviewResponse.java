package com.campushub.notification.dto;

import com.campushub.notification.dto.NotificationPageResponse.NotificationItem;
import java.util.List;

public record NotificationPreviewResponse(
        long unreadCount,
        List<NotificationItem> notifications
) {
}
