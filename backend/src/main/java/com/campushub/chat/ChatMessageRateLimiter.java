package com.campushub.chat;

import com.campushub.common.exception.TooManyRequestsException;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ChatMessageRateLimiter {

    private final Map<Long, ArrayDeque<Instant>> attempts = new ConcurrentHashMap<>();
    private final int maximumPerMinute;
    private final Clock clock;

    public ChatMessageRateLimiter(
            @Value("${app.chat.max-messages-per-minute:30}") int maximumPerMinute
    ) {
        this.maximumPerMinute = Math.max(1, maximumPerMinute);
        this.clock = Clock.systemUTC();
    }

    public void checkAllowed(Long userId) {
        Instant now = clock.instant();
        Instant cutoff = now.minus(1, ChronoUnit.MINUTES);
        ArrayDeque<Instant> userAttempts = attempts.computeIfAbsent(
                userId,
                ignored -> new ArrayDeque<>()
        );
        synchronized (userAttempts) {
            while (!userAttempts.isEmpty() && userAttempts.peekFirst().isBefore(cutoff)) {
                userAttempts.removeFirst();
            }
            if (userAttempts.size() >= maximumPerMinute) {
                throw new TooManyRequestsException(
                        "You are sending messages too quickly. Please wait a moment and try again."
                );
            }
            userAttempts.addLast(now);
        }
    }
}
