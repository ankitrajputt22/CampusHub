package com.campushub.marketplace.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductDetailsResponse(
        Long id,
        String title,
        String description,
        String additionalNotes,
        BigDecimal price,
        String category,
        String condition,
        String pickupLocation,
        boolean negotiable,
        int availableQuantity,
        String status,
        Instant createdAt,
        CollegeSummary college,
        List<String> images,
        SellerDetails seller,
        boolean wishlisted,
        boolean ownListing,
        boolean canBuy,
        boolean canReport,
        List<MarketplaceListingResponse> similarListings
) {

    public record CollegeSummary(
            Long id,
            String name,
            String code
    ) {
    }

    public record SellerDetails(
            Long id,
            String fullName,
            String profilePhotoUrl,
            boolean verifiedStudent,
            String collegeName,
            String department,
            String yearOfStudy,
            int trustScore,
            String trustLevel,
            double averageRating,
            long totalReviews,
            long successfulDeals,
            Instant memberSince
    ) {
    }
}
