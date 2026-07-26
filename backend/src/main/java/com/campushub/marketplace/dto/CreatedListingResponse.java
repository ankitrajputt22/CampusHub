package com.campushub.marketplace.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CreatedListingResponse(
        Long id,
        String title,
        BigDecimal price,
        String category,
        String condition,
        String pickupLocation,
        boolean negotiable,
        int availableQuantity,
        String status,
        String collegeName,
        String sellerName,
        List<String> images,
        Instant createdAt
) {
}
