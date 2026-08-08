package com.campushub.auth.service;

import com.campushub.common.exception.TooManyRequestsException;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class UsernameAvailabilityRateLimiter {

    private static final int MAX_REQUESTS_PER_WINDOW = 30;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final ConcurrentHashMap<String, RequestWindow> windows = new ConcurrentHashMap<>();

    public void check(String clientKey) {
        Instant now = Instant.now();
        RequestWindow window = windows.compute(clientKey, (key, current) -> {
            if (current == null || current.startedAt().plus(WINDOW).isBefore(now)) {
                return new RequestWindow(now, 1);
            }
            return new RequestWindow(current.startedAt(), current.requests() + 1);
        });

        if (window.requests() > MAX_REQUESTS_PER_WINDOW) {
            throw new TooManyRequestsException("Too many username checks. Please wait a minute and try again.");
        }
    }

    private record RequestWindow(Instant startedAt, int requests) {
    }
}
