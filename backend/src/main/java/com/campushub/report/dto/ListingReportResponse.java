package com.campushub.report.dto;

import java.time.Instant;

public record ListingReportResponse(
        Long reportId,
        Long listingId,
        String reason,
        String status,
        Instant submittedAt
) {
}
