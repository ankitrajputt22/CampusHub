package com.campushub.moderation.dto;

import java.time.Instant;

public record ModerationResultResponse(
        Long reportId,
        String reportStatus,
        String action,
        String targetType,
        Long targetId,
        String targetStatus,
        Instant updatedAt
) {
}
