package com.campushub.user.trustscore;

import java.time.Instant;
import java.util.List;

public record TrustScoreResponse(
        Long userId,
        int score,
        String level,
        String levelLabel,
        Breakdown breakdown,
        List<String> suggestions,
        Instant updatedAt
) {
    public record Breakdown(
            int verification,
            int profileCompletion,
            int marketplaceActivity,
            int orderCompletion,
            int reviews,
            int accountSecurity,
            int penalties,
            int totalPositive,
    int totalDeductions
    ) { }
}
