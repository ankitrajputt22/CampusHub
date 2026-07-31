package com.campushub.admin;

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
public class AdminAccessService {

    private final UserRepository userRepository;
    private final int requestsPerMinute;
    private final ConcurrentHashMap<Long, RateWindow> rateWindows =
            new ConcurrentHashMap<>();

    public AdminAccessService(
            UserRepository userRepository,
            @Value("${app.admin.rate-limit-per-minute:240}") int requestsPerMinute
    ) {
        this.userRepository = userRepository;
        this.requestsPerMinute = Math.max(30, requestsPerMinute);
    }

    public User requireActiveAdmin(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ForbiddenException(
                        "Administrator account was not found."
                ));
        if ((user.getRole() != UserRole.ADMIN
                && user.getRole() != UserRole.SUPER_ADMIN)
                || user.getStatus() != AccountStatus.ACTIVE
                || !user.isEmailVerified()
                || !user.isPhoneVerified()) {
            throw new ForbiddenException(
                    "An active administrator account is required."
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
                    "Too many admin requests. Please wait a moment and try again."
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
