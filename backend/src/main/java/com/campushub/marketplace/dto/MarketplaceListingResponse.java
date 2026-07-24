package com.campushub.marketplace.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record MarketplaceListingResponse(
        Long id,
        String title,
        String description,
        String category,
        BigDecimal price,
        String condition,
        String primaryImageUrl,
        String pickupLocation,
        boolean negotiable,
        Instant createdAt,
        SellerSummary seller,
        boolean wishlisted,
        boolean ownListing
) {

    public record SellerSummary(
            Long id,
            String fullName,
            String profilePhotoUrl,
            int trustScore
    ) {
    }
}
