package com.campushub.chat;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.campushub.common.exception.TooManyRequestsException;
import org.junit.jupiter.api.Test;

class ChatMessageRateLimiterTest {

    @Test
    void rejectsMessagesBeyondTheConfiguredPerMinuteLimit() {
        ChatMessageRateLimiter limiter = new ChatMessageRateLimiter(2);

        limiter.checkAllowed(42L);
        limiter.checkAllowed(42L);

        assertThatThrownBy(() -> limiter.checkAllowed(42L))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessageContaining("sending messages too quickly");
    }
}
