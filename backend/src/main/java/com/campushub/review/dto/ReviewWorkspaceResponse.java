package com.campushub.review.dto;

import java.time.Instant;
import java.util.List;

public record ReviewWorkspaceResponse(
        ReviewStats stats,
        List<PendingReview> pendingReviews,
        List<ReviewItem> receivedReviews,
        List<ReviewItem> givenReviews
) {

    public record ReviewStats(
            double averageRating,
            long receivedReviews,
            long givenReviews,
            long pendingReviews
    ) {
    }

    public record PendingReview(
            Long orderId,
            String orderNumber,
            Long listingId,
            String listingTitle,
            String coverImageUrl,
            Long sellerId,
            String sellerName,
            Instant completedAt
    ) {
    }

    public record ReviewItem(
            Long id,
            Long orderId,
            String orderNumber,
            Long listingId,
            String listingTitle,
            String reviewerName,
            String revieweeName,
            int rating,
            String message,
            Instant createdAt
    ) {
    }
}
