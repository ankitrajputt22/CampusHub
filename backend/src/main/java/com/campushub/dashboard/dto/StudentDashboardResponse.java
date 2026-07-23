package com.campushub.dashboard.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record StudentDashboardResponse(
        UserSummary user,
        TrustScoreSummary trustScore,
        ProfileCompletionSummary profileCompletion,
        DashboardStats stats,
        List<ListingSummary> latestListings,
        List<NotificationSummary> notifications,
        List<ActivitySummary> recentActivity,
        Instant generatedAt
) {

    public record UserSummary(
            Long id,
            String fullName,
            String email,
            Long collegeId,
            String collegeName,
            String collegeCode,
            String role,
            String accountStatus,
            boolean isEmailVerified,
            boolean isPhoneVerified,
            String department,
            String course,
            String yearOfStudy,
            String hostelOrCampusArea,
            String profilePhotoFileName
    ) {
    }

    public record TrustScoreSummary(
            int score,
            String level,
            List<String> suggestions
    ) {
    }

    public record ProfileCompletionSummary(
            int percentage,
            int completedFields,
            int totalFields,
            List<String> missingFields
    ) {
    }

    public record DashboardStats(
            long activeListings,
            long wishlistItems,
            long ordersPlaced,
            long itemsSold,
            long unreadNotifications
    ) {
    }

    public record ListingSummary(
            Long id,
            String title,
            BigDecimal price,
            String condition,
            String imageUrl,
            Long sellerId,
            String sellerName,
            int sellerTrustScore,
            Instant postedDate
    ) {
    }

    public record NotificationSummary(
            Long id,
            String type,
            String title,
            String message,
            boolean isRead,
            Instant createdAt
    ) {
    }

    public record ActivitySummary(
            Long id,
            String type,
            String message,
            Instant createdAt
    ) {
    }
}
