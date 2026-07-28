package com.campushub.report.dto;

import java.time.Instant;
import java.util.List;

public record AdminReportDetailsResponse(
        Long id,
        String type,
        Long entityId,
        String reason,
        String description,
        String status,
        String priority,
        String adminResponse,
        Instant submittedAt,
        Instant updatedAt,
        Instant reviewedAt,
        ReporterSummary reporter,
        TargetSummary target,
        long previousReportsForTarget,
        List<ModerationHistoryItem> moderationHistory
) {

    public record ReporterSummary(
            Long id,
            String fullName,
            String collegeName
    ) {
    }

    public record TargetSummary(
            Long id,
            String title,
            String subtitle,
            String status,
            Long ownerId,
            String ownerName
    ) {
    }

    public record ModerationHistoryItem(
            Long id,
            String action,
            String targetType,
            Long targetId,
            String previousState,
            String newState,
            String note,
            String moderatorName,
            Instant createdAt
    ) {
    }
}
