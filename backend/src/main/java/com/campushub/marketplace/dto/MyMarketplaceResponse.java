package com.campushub.marketplace.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record MyMarketplaceResponse(
        SellerStats stats,
        List<MyListingSummary> listings,
        PaginationSummary pagination
) {

    public record SellerStats(
            long totalListings,
            long activeListings,
            long soldListings,
            long inactiveListings,
            long totalViews,
            long totalWishlistSaves
    ) {
    }

    public record MyListingSummary(
            Long id,
            String title,
            BigDecimal price,
            String category,
            String condition,
            String pickupLocation,
            String status,
            String coverImageUrl,
            long views,
            long wishlistCount,
            Instant postedDate,
            Instant updatedAt,
            boolean negotiable
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
