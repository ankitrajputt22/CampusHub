package com.campushub.user.trustscore;

import java.time.Instant;
import java.util.List;

public record TrustScoreHistoryResponse(List<Entry> entries) {
    public record Entry(
            Long id,
            int scoreBefore,
            int scoreAfter,
            int change,
            String reason,
            String description,
            String sourceType,
            Instant createdAt
    ) { }
}
