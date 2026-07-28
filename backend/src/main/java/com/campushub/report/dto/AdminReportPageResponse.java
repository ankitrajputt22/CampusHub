package com.campushub.report.dto;

import java.time.Instant;
import java.util.List;

public record AdminReportPageResponse(
        QueueStats stats,
        List<QueueItem> reports,
        PaginationSummary pagination
) {

    public record QueueStats(
            long total,
            long pending,
            long underReview,
            long critical,
            long resolved
    ) {
    }

    public record QueueItem(
            Long id,
            String type,
            Long entityId,
            String targetTitle,
            String targetStatus,
            String reporterName,
            String reporterCollege,
            String reason,
            String status,
            String priority,
            Instant submittedAt,
            Instant updatedAt
    ) {
    }

    public record PaginationSummary(
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean hasMore
    ) {
    }
}
