package com.campushub.report.dto;

import java.time.Instant;

public record ReportSubmissionResponse(
        Long reportId,
        String type,
        Long entityId,
        Long listingId,
        String reason,
        String status,
        String priority,
        Instant submittedAt
) {
}
