package com.campushub.auth.service;

import com.campushub.common.exception.UnauthorizedException;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthSessionService {

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final NotificationService notificationService;

    public AuthSessionService(
            UserRepository userRepository,
            RefreshTokenService refreshTokenService,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.notificationService = notificationService;
    }

    @Transactional
    public void logoutAllDevices(Long authenticatedUserId) {
        User user = userRepository.findDashboardUserById(authenticatedUserId)
                .orElseThrow(() -> new UnauthorizedException(
                        "Authenticated account is no longer available."
                ));
        if (user.getRole() != UserRole.STUDENT
                || user.getStatus() != AccountStatus.ACTIVE
                || !user.isEmailVerified()
                || !user.isPhoneVerified()) {
            throw new UnauthorizedException(
                    "An active verified student account is required."
            );
        }

        notificationService.notify(
                user,
                NotificationType.SECURITY,
                NotificationPriority.HIGH,
                "Signed out from all devices",
                "All Campus Hub sessions for your account were signed out successfully.",
                RelatedEntityType.PROFILE,
                user.getId(),
                "/student/profile"
        );
        refreshTokenService.revokeAllForUser(user.getId());
    }
}
