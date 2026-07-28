package com.campushub.college.service;

import com.campushub.common.exception.TooManyRequestsException;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class ExploreRateLimiter {

    private static final int MAX_REQUESTS_PER_WINDOW = 60;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final ConcurrentHashMap<Long, RequestWindow> requests = new ConcurrentHashMap<>();

    public void check(Long userId) {
        RequestWindow window = requests.computeIfAbsent(
                userId,
                ignored -> new RequestWindow(Instant.now())
        );
        synchronized (window) {
            Instant now = Instant.now();
            if (window.startedAt.plus(WINDOW).isBefore(now)) {
                window.startedAt = now;
                window.count = 0;
            }
            window.count++;
            if (window.count > MAX_REQUESTS_PER_WINDOW) {
                throw new TooManyRequestsException(
                        "Too many explore requests. Please wait a moment and try again."
                );
            }
        }
    }

    private static final class RequestWindow {

        private Instant startedAt;
        private int count;

        private RequestWindow(Instant startedAt) {
            this.startedAt = startedAt;
        }
    }
}
