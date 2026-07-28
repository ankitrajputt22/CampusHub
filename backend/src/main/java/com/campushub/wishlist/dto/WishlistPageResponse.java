package com.campushub.wishlist.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record WishlistPageResponse(
        WishlistStats stats,
        List<WishlistItemSummary> items,
        PaginationSummary pagination
) {

    public record WishlistStats(
            long totalItems,
            long availableItems,
            long unavailableItems
    ) {
    }

    public record WishlistItemSummary(
            Long wishlistId,
            Instant savedAt,
            WishlistListing listing
    ) {
    }

    public record WishlistListing(
            Long id,
            String title,
            BigDecimal price,
            String category,
            String condition,
            String pickupLocation,
            String status,
            String coverImageUrl,
            boolean available,
            SellerSummary seller
    ) {
    }

    public record SellerSummary(
            Long id,
            String fullName,
            int trustScore,
            String trustLevel
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
