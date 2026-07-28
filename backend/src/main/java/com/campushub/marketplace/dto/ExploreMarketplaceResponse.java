package com.campushub.marketplace.dto;

import com.campushub.college.dto.ExploreCollegesResponse.CollegeCard;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ExploreMarketplaceResponse(
        ViewerContext viewerContext,
        CollegeCard selectedCollege,
        List<ExploreListingSummary> listings,
        PaginationSummary pagination,
        List<String> pickupLocations
) {

    public record ViewerContext(
            Long verifiedCollegeId,
            String verifiedCollegeName,
            String verifiedCollegeCode,
            Long browsingCollegeId,
            boolean ownCollege,
            boolean crossCollegeBuyingEnabled
    ) {
    }

    public record ExploreListingSummary(
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
            CollegeSummary college,
            SellerSummary seller,
            List<String> availableActions
    ) {
    }

    public record CollegeSummary(
            Long id,
            String name,
            String code
    ) {
    }

    public record SellerSummary(
            Long id,
            String fullName,
            String profilePhotoUrl,
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
