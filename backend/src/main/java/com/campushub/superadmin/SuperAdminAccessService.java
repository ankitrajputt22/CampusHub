package com.campushub.superadmin;

import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.TooManyRequestsException;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SuperAdminAccessService {

    private final UserRepository userRepository;
    private final int requestsPerMinute;
    private final ConcurrentHashMap<Long, RateWindow> rateWindows =
            new ConcurrentHashMap<>();

    public SuperAdminAccessService(
            UserRepository userRepository,
            @Value("${app.super-admin.rate-limit-per-minute:120}") int requestsPerMinute
    ) {
        this.userRepository = userRepository;
        this.requestsPerMinute = Math.max(20, requestsPerMinute);
    }

    public User requireActiveSuperAdmin(Long userId) {
        User user = userRepository.findAdminUserById(userId)
                .orElseThrow(() -> new ForbiddenException(
                        "Super Admin account was not found."
                ));
        if (user.getRole() != UserRole.SUPER_ADMIN
                || user.getStatus() != AccountStatus.ACTIVE
                || !user.isEmailVerified()
                || !user.isPhoneVerified()) {
            throw new ForbiddenException(
                    "Only Super Admin can perform this action."
            );
        }
        checkRateLimit(userId);
        return user;
    }

    private void checkRateLimit(Long userId) {
        long minute = Instant.now().getEpochSecond() / 60;
        RateWindow updated = rateWindows.compute(userId, (ignored, existing) -> {
            if (existing == null || existing.minute() != minute) {
                return new RateWindow(minute, 1);
            }
            return new RateWindow(minute, existing.count() + 1);
        });
        if (updated.count() > requestsPerMinute) {
            throw new TooManyRequestsException(
                    "Too many Super Admin requests. Please wait a moment and try again."
            );
        }
        if (rateWindows.size() > 2_000) {
            rateWindows.entrySet().removeIf(
                    entry -> entry.getValue().minute() < minute - 1
            );
        }
    }

    private record RateWindow(long minute, int count) {
    }
}
