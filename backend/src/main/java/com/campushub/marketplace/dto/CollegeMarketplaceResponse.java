package com.campushub.marketplace.dto;

import java.util.List;

public record CollegeMarketplaceResponse(
        CollegeSummary college,
        List<MarketplaceListingResponse> listings,
        PaginationSummary pagination,
        List<String> pickupLocations
) {

    public record CollegeSummary(
            Long id,
            String name,
            String code
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
