package com.campushub.marketplace.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record MyListingDetailsResponse(
        Long id,
        String title,
        String description,
        String category,
        BigDecimal price,
        String condition,
        String pickupLocation,
        boolean negotiable,
        int availableQuantity,
        String additionalNotes,
        String status,
        String collegeName,
        String sellerName,
        List<String> images,
        long views,
        long wishlistCount,
        Instant createdAt,
        Instant updatedAt
) {
}
