package com.campushub.support;

import com.campushub.common.exception.TooManyRequestsException;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PublicSupportRateLimiter {

    private final int requestsPerHour;
    private final ConcurrentHashMap<String, RateWindow> windows = new ConcurrentHashMap<>();

    public PublicSupportRateLimiter(
            @Value("${app.support.public-rate-limit-per-hour:5}") int requestsPerHour
    ) {
        this.requestsPerHour = Math.max(1, requestsPerHour);
    }

    public void check(String remoteAddress, String email) {
        long hour = Instant.now().getEpochSecond() / 3600;
        String key = safe(remoteAddress) + ":" + safe(email).toLowerCase(Locale.ROOT);
        RateWindow updated = windows.compute(key, (ignored, existing) -> {
            if (existing == null || existing.hour() != hour) {
                return new RateWindow(hour, 1);
            }
            return new RateWindow(hour, existing.count() + 1);
        });
        if (updated.count() > requestsPerHour) {
            throw new TooManyRequestsException(
                    "Too many support requests. Please wait before submitting another request."
            );
        }
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(entry -> entry.getValue().hour() < hour - 1);
        }
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "unknown" : value.trim();
    }

    private record RateWindow(long hour, int count) {
    }
}
