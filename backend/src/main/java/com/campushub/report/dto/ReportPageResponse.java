package com.campushub.report.dto;

import java.time.Instant;
import java.util.List;

public record ReportPageResponse(
        ReportStats stats,
        List<ReportItem> reports,
        PaginationSummary pagination
) {

    public record ReportStats(
            long total,
            long pending,
            long underReview,
            long actionTaken,
            long rejected,
            long closed
    ) {
    }

    public record ReportItem(
            Long id,
            String type,
            Long entityId,
            String targetTitle,
            String targetSubtitle,
            String targetStatus,
            String reason,
            String description,
            String status,
            String priority,
            String adminResponse,
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
