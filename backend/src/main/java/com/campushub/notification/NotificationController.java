package com.campushub.notification;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.notification.dto.NotificationPageResponse;
import com.campushub.notification.dto.NotificationPreviewResponse;
import com.campushub.notification.dto.NotificationReadResponse;
import com.campushub.notification.dto.NotificationUnreadCountResponse;
import com.campushub.notification.dto.NotificationsMarkedReadResponse;
import com.campushub.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<NotificationPageResponse> getNotifications(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy
    ) {
        return ApiResponse.success(
                "Notifications loaded successfully",
                notificationService.getNotifications(
                        userId(authenticatedUser),
                        type,
                        isRead,
                        priority,
                        page,
                        size,
                        sortBy
                )
        );
    }

    @GetMapping("/preview")
    public ApiResponse<NotificationPreviewResponse> getPreview(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "Notification preview loaded successfully",
                notificationService.getPreview(userId(authenticatedUser), size)
        );
    }

    @GetMapping("/unread-count")
    public ApiResponse<NotificationUnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(
                "Unread notification count loaded successfully",
                notificationService.getUnreadCount(userId(authenticatedUser))
        );
    }

    @PatchMapping("/{notificationId}/read")
    public ApiResponse<NotificationReadResponse> markRead(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long notificationId
    ) {
        return ApiResponse.success(
                "Notification marked as read",
                notificationService.markRead(
                        userId(authenticatedUser),
                        notificationId
                )
        );
    }

    @PatchMapping("/mark-all-read")
    public ApiResponse<NotificationsMarkedReadResponse> markAllRead(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(
                "All notifications marked as read",
                notificationService.markAllRead(userId(authenticatedUser))
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
