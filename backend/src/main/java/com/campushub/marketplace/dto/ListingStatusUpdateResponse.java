package com.campushub.marketplace.dto;

import java.time.Instant;

public record ListingStatusUpdateResponse(
        Long id,
        String status,
        Instant updatedAt
) {
}
